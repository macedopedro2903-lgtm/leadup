import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { effectivePlan, planLimits, ACTIVE_LEAD_STATUSES } from '@/lib/plan'
import { APP_CONFIG } from '@/config/app'
import { guessMapping, cleanMapping, parseLine, type ParsedLine } from '@/lib/lead-import'
import { normalizePhone } from '@/lib/whatsapp'
import { parseCsv } from '@/lib/csv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const active = new Set<string>(ACTIVE_LEAD_STATUSES)
const fail = (message: string, status=400) => NextResponse.json({error:message},{status})

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return fail('Não autorizado.',401)
  const user = await prisma.user.findUnique({where:{id:userId}})
  if (!user) return fail('Não autorizado.',401)
  const form = await req.formData().catch(()=>null)
  if (!form) return fail('Formulário inválido.')
  const file = form.get('file')
  const action = form.get('action') === 'commit' ? 'commit' : 'preview'
  const behavior = ['skip','update','merge'].includes(String(form.get('duplicates'))) ? String(form.get('duplicates')) : 'skip'
  if (!(file instanceof File)) return fail('Selecione uma planilha.')
  if (!/\.(csv|xlsx)$/i.test(file.name)) return fail('Somente CSV ou XLSX.')
  if (file.size===0 || file.size>APP_CONFIG.MAX_IMPORT_FILE_BYTES) return fail('Arquivo vazio ou maior que 2 MB.')
  let matrix: unknown[][]
  try {
    const buffer=Buffer.from(await file.arrayBuffer())
    if(/\.csv$/i.test(file.name)) {
      matrix=parseCsv(buffer.toString('utf8'))
    } else {
      const book=XLSX.read(buffer,{type:'buffer',cellDates:false,bookVBA:false,bookSheets:false})
      const sheet=book.Sheets[book.SheetNames[0]]
      if (!sheet) return fail('A planilha não contém abas.')
      const limits=XLSX.utils.decode_range(sheet['!ref']??'A1')
      if(limits.e.r>APP_CONFIG.MAX_IMPORT_ROWS || limits.e.c>49) return fail('Planilha acima do limite de linhas ou colunas.')
      matrix=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:false,defval:'',blankrows:false})
    }
  } catch { return fail('Arquivo inválido ou corrompido.') }
  if (matrix.length<2) return fail('A planilha precisa ter cabeçalho e pelo menos uma linha.')
  if (matrix.length-1>APP_CONFIG.MAX_IMPORT_ROWS) return fail(`Máximo de ${APP_CONFIG.MAX_IMPORT_ROWS} linhas por importação.`)
  const headers=(matrix[0]??[]).map(v=>String(v??'').trim())
  if (headers.length>50 || headers.length===0 || headers.some(h=>!h)) return fail('Cabeçalho inválido (máximo 50 colunas, todas com título).')
  if (new Set(headers).size!==headers.length) return fail('A planilha contém cabeçalhos repetidos.')
  let rawMapping:unknown
  try { rawMapping=JSON.parse(String(form.get('mapping')??'null')) } catch {return fail('Mapeamento inválido.')}
  const mapping=form.has('mapping') ? cleanMapping(headers,rawMapping) : guessMapping(headers)
  if (!mapping.phone) return NextResponse.json({error:'Selecione a coluna de telefone.',headers,mapping},{status:422})
  const rows:ParsedLine[]=matrix.slice(1).map((r,i)=>parseLine(headers,mapping,r,i+2))
  const processImport = async (tx: Prisma.TransactionClient) => {
  // Re-read plan and lead counts in the same serializable snapshot as all writes.
  const user = await tx.user.findUnique({where:{id:userId}})
  if (!user) return fail('Não autorizado.',401)
  const leads=await tx.lead.findMany({where:{userId},select:{id:true,phone:true,normalizedPhone:true,name:true,status:true,notes:true}})
  const existing=new Map<string,typeof leads[number]>()
  // Do not arbitrarily pick one lead when legacy records share a normalized phone.
  const ambiguous=new Set<string>()
  for(const lead of leads) {
    const phone=lead.normalizedPhone || normalizePhone(lead.phone)
    if (!phone) continue
    if (existing.has(phone)) ambiguous.add(phone)
    else existing.set(phone,lead)
  }
  let slots=Infinity
  if(effectivePlan(user)==='FREE') {
    const count=leads.filter(l=>active.has(l.status)).length
    slots=Math.max(0,planLimits('FREE').activeLeadsLimit-count)
  }
  const seen=new Set<string>()
  let newCount=0, existingCount=0, errors=0, limitCount=0
  const decisions=rows.map(row=>{
    if(row.error || !row.input) {errors++;return {...row,result:'ERRO',reason:row.error??'Linha inválida'}}
    if(ambiguous.has(row.normalizedPhone)) {errors++;return {...row,result:'ERRO',reason:'Telefone associado a vários leads antigos; revise os cadastros antes de importar'}}
    if(seen.has(row.normalizedPhone)) {existingCount++;return {...row,result:'JÁ EXISTE',reason:'Repetido na planilha'}}
    seen.add(row.normalizedPhone)
    const found=existing.get(row.normalizedPhone)
    if(found) {
      existingCount++
      if(behavior!=='skip' && !active.has(found.status) && active.has(row.input.status) && row.input.explicitStatus && slots<=0) {
        limitCount++;return {...row,result:'LIMITE',reason:'Limite de leads ativos do plano'}
      }
      if(behavior!=='skip' && !active.has(found.status) && active.has(row.input.status) && row.input.explicitStatus) slots--
      return {...row,result:'JÁ EXISTE',reason: `Lead existente: ${found.name}`}
    }
    if(active.has(row.input.status) && slots<=0) {
      limitCount++;return {...row,result:'LIMITE',reason:'Limite de leads ativos do plano'}
    }
    if(active.has(row.input.status)) slots--
    newCount++
    return {...row,result:'NOVO',reason:''}
  })
  const preview={headers,mapping,total:rows.length,novos:newCount,existentes:existingCount,erros:errors,limite:limitCount,
    rows:decisions.map(({line,name,phone,status,result,reason})=>({line,name,phone,status,result,reason})),
    canImport:newCount>0||(behavior!=='skip'&&existingCount>0)}
  if(action==='preview') return NextResponse.json(preview)

  let created=0,updated=0,skipped=0
  const createInputs:NonNullable<ParsedLine['input']>[]=[]
  for (let i=0;i<decisions.length;i++) {
    const d=decisions[i], input=rows[i].input
    if(d.result==='NOVO' && input) createInputs.push(input)
    else if(d.result==='JÁ EXISTE' && input && behavior!=='skip' && !d.reason.startsWith('Repetido')) {
      const target=existing.get(input.normalizedPhone)
      if(!target) {skipped++;continue}
      const data={
        ...(input.nameProvided?{name:input.name}:{}),phone:input.phone,
        ...(input.company?{company:input.company}:{}),
        ...(input.service?{service:input.service}:{}),
        ...(input.value!==undefined?{value:input.value}:{}),
        ...(input.explicitStatus?{status:input.status}:{}),
        ...(input.nextFollowup?{nextFollowup:input.nextFollowup}:{}),
        ...(input.email?{email:input.email}:{}),
        ...(input.importOrigin?{importOrigin:input.importOrigin}:{}),
        ...(input.notes?{notes:behavior==='merge'&&target.notes ? `${target.notes}\n${input.notes}` : input.notes}:{}),
        normalizedPhone:input.normalizedPhone,
      }
      await tx.lead.update({where:{id:target.id,userId},data});updated++
    } else if(d.result==='JÁ EXISTE' || d.result==='LIMITE') skipped++
  }
  for(let offset=0;offset<createInputs.length;offset+=200) {
    const batch=createInputs.slice(offset,offset+200)
    const result=await tx.lead.createMany({data:batch.map(input=>({
      userId,name:input.name,phone:input.phone,normalizedPhone:input.normalizedPhone,
      company:input.company,service:input.service,value:input.value,status:input.status,
      notes:input.notes,nextFollowup:input.nextFollowup,importOrigin:input.importOrigin,
      email:input.email,source:'IMPORT',
    })),skipDuplicates:true})
    created+=result.count
    skipped+=batch.length-result.count
  }
  await tx.leadImportAudit.create({data:{userId,fileName:file.name.slice(0,200),total:rows.length,created,updated,skipped,errors}})
  return NextResponse.json({created,updated,skipped,errors,limit:limitCount,total:rows.length,
    errorRows:preview.rows.filter(r=>r.result==='ERRO' || r.result==='LIMITE')})
  }
  for (let attempt=0;attempt<4;attempt++) {
    try {
      return await prisma.$transaction(processImport,{
        isolationLevel:Prisma.TransactionIsolationLevel.Serializable,
        timeout:60000,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code==='P2034' && attempt<3) continue
      // The transaction has rolled back; never report a partial import as success.
      return fail('Não foi possível concluir a importação. Nenhuma alteração desta tentativa foi salva. Tente novamente.',503)
    }
  }
  return fail('Importação concorrente. Tente novamente.',503)
}
