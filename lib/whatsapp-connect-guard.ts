import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

const COOKIE = 'leadup_wa_connect_state'

export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  return Boolean(origin && origin === req.nextUrl.origin)
}

export function freshNonce(userId: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Auth secret missing')
  const nonce = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const sig = createHmac('sha256',secret).update(`${userId}.${timestamp}.${nonce}`).digest('hex')
  return {nonce, cookie:`${timestamp}.${nonce}.${sig}`}
}

export function validNonce(userId: string, cookie: string | undefined, nonce: string): boolean {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret || !cookie || !/^[a-f0-9]{64}$/.test(nonce)) return false
  const [ts, fromCookie, signature] = cookie.split('.')
  if (!ts || !fromCookie || !signature || fromCookie !== nonce || !/^\d{13}$/.test(ts) || Date.now()-Number(ts)>10*60*1000 || Date.now()<Number(ts)) return false
  const computed = createHmac('sha256', secret).update(`${userId}.${ts}.${nonce}`).digest('hex')
  if (!/^[a-f0-9]{64}$/.test(signature)) return false
  return timingSafeEqual(Buffer.from(computed,'hex'), Buffer.from(signature,'hex'))
}
export {COOKIE}
