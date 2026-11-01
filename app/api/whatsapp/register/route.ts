import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/session'
import { prisma } from '@/lib/db'
import { sameOrigin } from '@/lib/whatsapp-connect-guard'
import { decryptStoredToken, metaGraph } from '@/lib/whatsapp-meta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  if (!sameOrigin(req)) return NextResponse.json({error:'Origem não autorizada.'},{status:403})
  const payload:unknown = await req.json().catch(()=>null)
  const pin = payload && typeof payload==='object' ? (payload as {pin?:unknown}).pin : null
  if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) return NextResponse.json({error:'Informe um PIN de seis dígitos.'},{status:400})
  const connection = await prisma.whatsAppConnection.findUnique({where:{userId}})
  if (!connection) return NextResponse.json({error:'Conecte primeiro uma conta WhatsApp.'},{status:404})
  if (connection.status === 'CONNECTED') return NextResponse.json({ok:true,status:'CONNECTED'})
  try {
    const registered=await metaGraph<{success?:boolean|string}>(`/${connection.phoneNumberId}/register`,decryptStoredToken(connection.encryptedToken),'POST',{messaging_product:'whatsapp',pin})
    if (registered.success !== true && registered.success !== 'true') throw new Error('Meta did not confirm phone registration')
    await prisma.whatsAppConnection.update({where:{id:connection.id},data:{status:'CONNECTED',activatedAt:new Date()}})
    return NextResponse.json({ok:true,status:'CONNECTED'})
  } catch {
    return NextResponse.json({error:'A Meta não confirmou o registro. Verifique o PIN e a autorização do número.'},{status:502})
  }
}
