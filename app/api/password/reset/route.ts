import {NextRequest} from 'next/server'
import {z} from 'zod'
import bcrypt from 'bcryptjs'
import {sameOrigin} from '@/lib/whatsapp-connect-guard'
import {hashResetToken} from '@/lib/password-reset'
import {serializable,apiError,BusinessError} from '@/lib/transactions'

export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return Response.json({error:'Origem não autorizada.'},{status:403})
  const parsed=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(8).refine(v=>Buffer.byteLength(v)<=72)}).safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return Response.json({error:'Link inválido ou senha fora do limite de 8 a 72 bytes.'},{status:400})
  const hash=hashResetToken(parsed.data.token)
  const hashedPassword=await bcrypt.hash(parsed.data.password,12)
  try {
    await serializable(async tx=>{
      const token=await tx.passwordReset.findUnique({where:{tokenHash:hash}})
      if(!token||token.usedAt||token.expiresAt<=new Date())throw new BusinessError('Link expirado ou já utilizado. Solicite outro.',400)
      await tx.passwordReset.update({where:{id:token.id},data:{usedAt:new Date()}})
      await tx.user.update({where:{id:token.userId},data:{hashedPassword,sessionVersion:{increment:1}}})
      await tx.passwordReset.updateMany({where:{userId:token.userId,usedAt:null},data:{usedAt:new Date()}})
    })
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})
  }catch(error){return apiError(error)}
}
