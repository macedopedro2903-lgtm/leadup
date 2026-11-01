import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMetaSignature, parseMetaInbound } from '@/lib/whatsapp-meta-core'
import { recordVerifiedInboundMessage } from '@/lib/whatsapp-inbound'
import { normalizePhone } from '@/lib/whatsapp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Facebook/WhatsApp verifies this URL once using a shared, private verify token. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN
  if (expected && params.get('hub.mode')==='subscribe' && params.get('hub.verify_token')===expected && params.get('hub.challenge')) {
    return new NextResponse(params.get('hub.challenge'),{status:200,headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}})
  }
  return new NextResponse('Forbidden',{status:403})
}

export async function POST(req: NextRequest) {
  const secret = process.env.META_APP_SECRET
  if (!secret) return new NextResponse('Not configured',{status:503})
  // A small cap limits memory/compute consumption by unsolicited requests.
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength>1024*1024) return new NextResponse('Too large',{status:413})
  let raw:string
  try {
    raw = await req.text()
    if (Buffer.byteLength(raw)>1024*1024) return new NextResponse('Too large',{status:413})
  } catch {return new NextResponse('Bad request',{status:400})}
  if (!verifyMetaSignature(raw,req.headers.get('x-hub-signature-256'),secret)) return new NextResponse('Invalid signature',{status:401})
  let payload:unknown
  try {payload=JSON.parse(raw)} catch{return new NextResponse('Bad JSON',{status:400})}
  const incoming=parseMetaInbound(payload)
  if (incoming.length===0) return NextResponse.json({ok:true})
  const phoneNumbers=[...new Set(incoming.map(item=>item.phoneNumberId))]
  const connections=await prisma.whatsAppConnection.findMany({where:{phoneNumberId:{in:phoneNumbers},status:'CONNECTED'},select:{userId:true,id:true,phoneNumberId:true}})
  const byPhone=new Map(connections.map(c=>[c.phoneNumberId,c]))
  try {
    for (const item of incoming) {
      const connection=byPhone.get(item.phoneNumberId)
      if (!connection) continue // Never route unrecognized phones to arbitrary accounts.
      if (!normalizePhone(item.from)) continue // Currently only Brazilian phone numbers are supported.
      try {
        await recordVerifiedInboundMessage({userId:connection.userId,phone:item.from,providerMessageId:item.messageId,body:item.body,displayName:item.displayName})
        await prisma.whatsAppConnection.updateMany({where:{id:connection.id,status:'CONNECTED'},data:{lastInboundAt:new Date(),lastError:null}})
      } catch (error) {
        if (error instanceof Error && (error.message==='Lead limit reached' || error.message==='Duplicate legacy leads require manual review')) {
          // Do not force infinite Meta retries for an account-level business rule.
          // Preserve an owner-visible summary without logging the message content.
          await prisma.whatsAppConnection.updateMany({where:{id:connection.id,status:'CONNECTED'},data:{
            skippedMessages:{increment:1},
            lastError:error.message==='Lead limit reached' ? 'Limite de leads ativos atingido. Mensagem não importada.' : 'Leads antigos duplicados: verifique os contatos antes de importar.',
          }})
          continue
        }
        throw error
      }
    }
  } catch {
    // Meta retries on server failure. The message idempotency key prevents repeated inserts.
    return new NextResponse('Processing failed',{status:500})
  }
  return NextResponse.json({ok:true})
}
