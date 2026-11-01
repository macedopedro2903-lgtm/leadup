import {NextRequest} from 'next/server'
import {z} from 'zod'
import {prisma} from '@/lib/db'
import {sameOrigin} from '@/lib/whatsapp-connect-guard'
import {mailReady,newResetToken,sendResetEmail} from '@/lib/password-reset'
import {serializable} from '@/lib/transactions'

const answer={ok:true,message:'Se houver uma conta com esse email, enviaremos as instruções de recuperação.'}
export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return Response.json({error:'Origem não autorizada.'},{status:403})
  if(!mailReady())return Response.json({error:'Recuperação por email ainda indisponível. A configuração de envio precisa ser concluída.'},{status:503})
  const parsed=z.object({email:z.string().trim().email().max(254)}).safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return Response.json({error:'Informe um email válido.'},{status:400})
  const {token,hash}=newResetToken()
  const account=await serializable(async tx=>{
    const user=await tx.user.findUnique({where:{email:parsed.data.email.toLowerCase()}})
    if(!user)return null
    const recent=await tx.passwordReset.findFirst({where:{userId:user.id,createdAt:{gte:new Date(Date.now()-60000)}}})
    if(recent)return null
    await tx.passwordReset.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}})
    await tx.passwordReset.create({data:{userId:user.id,tokenHash:hash,expiresAt:new Date(Date.now()+1800000)}})
    return {email:user.email}
  })
  if(account)try {await sendResetEmail(account.email,token)}catch{
    await prisma.passwordReset.updateMany({where:{tokenHash:hash,usedAt:null},data:{usedAt:new Date()}})
    console.error('[password-reset] Email delivery unavailable')
  }
  return Response.json(answer,{headers:{'Cache-Control':'no-store'}})
}
