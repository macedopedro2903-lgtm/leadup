import {z} from 'zod'
import {getSessionUserId} from '@/lib/session'
import {apiError,BusinessError,serializable} from '@/lib/transactions'
import {moneyInput,dateInput} from '@/lib/lead-validation'

const schema=z.object({version:z.number().int().positive(),title:z.string().trim().min(1).max(160).optional(),description:z.string().trim().max(10000).nullable().optional(),amount:moneyInput.refine(v=>v!==null).optional(),status:z.enum(['RASCUNHO','ENVIADO','ACEITO','RECUSADO']).optional(),validUntil:dateInput.nullish()})
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
  const userId=await getSessionUserId()
  if(!userId)return Response.json({error:'Não autorizado.'},{status:401})
  const {id}=await params
  const parsed=schema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message},{status:400})
  try {
    const quote=await serializable(async tx=>{
      const previous=await tx.quote.findFirst({where:{id,userId}})
      if(!previous)throw new BusinessError('Orçamento não encontrado.',404)
      if(previous.version!==parsed.data.version)throw new BusinessError('O orçamento foi alterado em outra aba. Atualize a página.',409)
      const {version,validUntil,...data}=parsed.data
      if(version!==previous.version)throw new BusinessError('Atualize a página.',409)
      const quote=await tx.quote.update({where:{id,userId},data:{...data,version:{increment:1},...(validUntil!==undefined?{validUntil:validUntil?new Date(validUntil):null}:{})}})
      await tx.leadActivity.create({data:{userId,leadId:quote.leadId,kind:'QUOTE',summary:`Orçamento ${id}, revisão ${quote.version}: ${quote.title}; R$ ${quote.amount}; ${previous.status} → ${quote.status}`}})
      return quote
    })
    return Response.json({quote})
  }catch(error){return apiError(error)}
}
