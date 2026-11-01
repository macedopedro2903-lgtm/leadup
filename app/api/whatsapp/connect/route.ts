import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { prisma } from '@/lib/db'
import { COOKIE, freshNonce, sameOrigin, validNonce } from '@/lib/whatsapp-connect-guard'
import { encryptStoredToken, exchangeSignupCode, metaGraph, publicMetaSettings, verifyPhoneInWaba } from '@/lib/whatsapp-meta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const numberId = /^\d{5,30}$/
const nonCached = {headers:{'Cache-Control':'no-store'}}

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  const settings = publicMetaSettings()
  const existing = await prisma.whatsAppConnection.findUnique({where:{userId},select:{status:true,displayPhone:true,connectedAt:true,lastError:true,skippedMessages:true}})
  const {nonce,cookie} = freshNonce(userId)
  const result = NextResponse.json({settings,connection: existing ? {status:existing.status,displayPhone:existing.displayPhone,connectedAt:existing.connectedAt,lastError:existing.lastError,skippedMessages:existing.skippedMessages} : null,nonce},nonCached)
  result.cookies.set(COOKIE,cookie,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/api/whatsapp/connect',maxAge:600})
  return result
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  if (!sameOrigin(req)) return NextResponse.json({error:'Origem não autorizada.'},{status:403})
  if (!publicMetaSettings().ready) return NextResponse.json({error:'Integração Meta ainda não configurada.'},{status:503})
  const data:unknown = await req.json().catch(()=>null)
  if (!data || typeof data!=='object') return NextResponse.json({error:'Solicitação inválida.'},{status:400})
  const {code,wabaId,phoneNumberId,nonce} = data as Record<string,unknown>
  if (typeof code!=='string'||code.length<8||code.length>2000||typeof wabaId!=='string'||!numberId.test(wabaId)||typeof phoneNumberId!=='string'||!numberId.test(phoneNumberId)||typeof nonce!=='string'||!validNonce(userId,req.cookies.get(COOKIE)?.value,nonce)) {
    return NextResponse.json({error:'Autorização expirada ou inválida. Reinicie a conexão.'},{status:403})
  }
  const previous = await prisma.whatsAppConnection.findUnique({where:{userId}})
  if (previous) return NextResponse.json({error:'Desconecte a conta anterior antes de vincular outro número.'},{status:409})
  const owned = await prisma.whatsAppConnection.findUnique({where:{phoneNumberId}})
  if (owned) return NextResponse.json({error:'Esse número já está vinculado a outra conta LeadUp.'},{status:409})
  try {
    const token = await exchangeSignupCode(code)
    const displayPhone = await verifyPhoneInWaba(wabaId,phoneNumberId,token)
    // Meta delivers messages only after the app is subscribed to the authorized WABA.
    const subscription = await metaGraph<{success?:boolean|string}>(`/${wabaId}/subscribed_apps`,token,'POST')
    if (subscription.success !== true && subscription.success !== 'true') throw new Error('Meta did not confirm subscription')
    await prisma.whatsAppConnection.create({data:{
      userId,wabaId,phoneNumberId,displayPhone,encryptedToken:encryptStoredToken(token),status:'PENDING_REGISTRATION'
    }})
    const response = NextResponse.json({ok:true,status:'PENDING_REGISTRATION'},nonCached)
    response.cookies.set(COOKIE,'',{path:'/api/whatsapp/connect',maxAge:0})
    return response
  } catch (error) {
    // No Meta access tokens or error response bodies enter logs/client responses.
    const conflict = error && typeof error==='object' && 'code' in error && error.code === 'P2002'
    return NextResponse.json({error:conflict?'Este número já está conectado a outra conta.':'Não foi possível completar a autorização com a Meta. Confira as permissões e tente novamente.'},{status:conflict?409:502})
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  if (!sameOrigin(req)) return NextResponse.json({error:'Origem não autorizada.'},{status:403})
  // This intentionally leaves leads and their message history intact.
  await prisma.whatsAppConnection.deleteMany({where:{userId}})
  return NextResponse.json({ok:true},nonCached)
}
