import {createHash,randomBytes} from 'node:crypto'
export function newResetToken(){const token=randomBytes(32).toString('hex');return {token,hash:hashResetToken(token)}}
export function hashResetToken(token:string){return createHash('sha256').update(token).digest('hex')}
export function mailReady(){return !!(process.env.RESEND_API_KEY&&process.env.PASSWORD_RESET_FROM&&process.env.LEADUP_PUBLIC_ORIGIN)}
export async function sendResetEmail(email:string,token:string) {
  const origin=new URL(process.env.LEADUP_PUBLIC_ORIGIN!)
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Invalid public origin')
  const url=new URL('/redefinir-senha',origin);url.searchParams.set('token',token)
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.PASSWORD_RESET_FROM,to:[email],subject:'Redefinir sua senha do LeadUp',text:`Você solicitou uma nova senha do LeadUp. Abra este link em até 30 minutos: ${url}\nSe não foi você, ignore este email.`}),signal:AbortSignal.timeout(12000)})
  if(!response.ok)throw new Error('Email delivery failed')
}
