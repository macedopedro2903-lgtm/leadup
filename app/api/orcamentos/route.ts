import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { moneyInput, dateInput } from '@/lib/lead-validation'
import { apiError, BusinessError, serializable } from '@/lib/transactions'

export const dynamic = 'force-dynamic'
const schema = z.object({leadId:z.string().min(1),title:z.string().trim().min(1).max(160),description:z.string().trim().max(10000).nullish(),amount:moneyInput.refine(v=>v!==null,'Informe o valor.'),validUntil:dateInput.nullish()})
export async function GET() {
  const userId=await getSessionUserId()
  if(!userId)return Response.json({error:'Não autorizado.'},{status:401})
  return Response.json({quotes:await prisma.quote.findMany({where:{userId},include:{lead:{select:{name:true}}},orderBy:{createdAt:'desc'}})})
}
export async function POST(req:Request) {
  const userId=await getSessionUserId()
  if(!userId)return Response.json({error:'Não autorizado.'},{status:401})
  const parsed=schema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message},{status:400})
  try {
    const quote=await serializable(async tx=>{
      const lead=await tx.lead.findFirst({where:{id:parsed.data.leadId,userId}})
      if(!lead)throw new BusinessError('Lead não encontrado.',404)
      const quote=await tx.quote.create({data:{...parsed.data,userId,amount:parsed.data.amount!,validUntil:parsed.data.validUntil?new Date(parsed.data.validUntil):null}})
      await tx.leadActivity.create({data:{userId,leadId:lead.id,kind:'QUOTE',summary:`Orçamento ${quote.id}: ${quote.title}; R$ ${quote.amount}; RASCUNHO`}})
      return quote
    })
    return Response.json({quote},{status:201})
  }catch(error){return apiError(error)}
}
