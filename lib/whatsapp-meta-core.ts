import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** Small, dependency-free primitives. Never expose secrets to the browser. */
export function verifyMetaSignature(raw: string | Buffer, signature: string | null, appSecret: string): boolean {
  if (!appSecret || !signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', appSecret).update(raw).digest()
  const provided = Buffer.from(signature.slice(7), 'hex')
  return provided.length === expected.length && timingSafeEqual(expected, provided)
}

export function tokenKey(base64: string | undefined): Buffer {
  if (!base64 || !/^[A-Za-z0-9+/]{43}=$/.test(base64)) throw new Error('WhatsApp encryption key missing or invalid')
  const decoded = Buffer.from(base64, 'base64')
  if (decoded.length !== 32 || decoded.toString('base64') !== base64) throw new Error('Invalid encryption key')
  return decoded
}

export function encryptMetaToken(token: string, key: Buffer): string {
  if (!token || key.length !== 32) throw new Error('Invalid token/key')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const payload = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${payload.toString('base64url')}`
}

export function decryptMetaToken(value: string, key: Buffer): string {
  const parts = value.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1' || key.length !== 32) throw new Error('Invalid encrypted token')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(parts[1], 'base64url'))
  decipher.setAuthTag(Buffer.from(parts[2], 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64url')), decipher.final()]).toString('utf8')
}

export type InboundMetaMessage = {
  phoneNumberId: string
  from: string
  messageId: string
  body: string
  displayName?: string
}

/** Extracts inbound messages only; statuses/outbound echoes never generate leads. */
export function parseMetaInbound(payload: unknown): InboundMetaMessage[] {
  if (!payload || typeof payload !== 'object' || (payload as { object?: unknown }).object !== 'whatsapp_business_account') return []
  const entries = (payload as { entry?: unknown }).entry
  if (!Array.isArray(entries)) return []
  const results: InboundMetaMessage[] = []
  for (const entry of entries.slice(0, 100)) {
    if (!entry || typeof entry !== 'object') continue
    const changes = (entry as {changes?:unknown}).changes
    if (!Array.isArray(changes)) continue
    for (const rawChange of changes.slice(0, 100)) {
      const change = rawChange as {field?:unknown; value?:unknown}
      if (!change || change.field !== 'messages' || !change.value || typeof change.value !== 'object') continue
      const value = change.value as Record<string, unknown>
      const metadata = value.metadata as Record<string, unknown> | undefined
      if (typeof metadata?.phone_number_id !== 'string' || !/^\d{5,30}$/.test(metadata.phone_number_id)) continue
      const contacts = Array.isArray(value.contacts) ? value.contacts : []
      const names = new Map<string, string>()
      for (const c of contacts) {
        if (c && typeof c.wa_id === 'string' && typeof c.profile?.name === 'string') names.set(c.wa_id, c.profile.name.slice(0, 160))
      }
      if (!Array.isArray(value.messages)) continue
      for (const m of value.messages.slice(0, 100)) {
        if (!m || typeof m.from !== 'string' || typeof m.id !== 'string' || m.id.length > 200 || !m.id || !/^\d{10,15}$/.test(m.from)) continue
        const type = typeof m.type === 'string' ? m.type : 'unknown'
        const text = type === 'text' && typeof m.text?.body === 'string' ? m.text.body :
          (typeof m[type]?.caption === 'string' ? m[type].caption : `[Mensagem ${type.slice(0, 30)}]`)
        results.push({phoneNumberId: metadata.phone_number_id, from: m.from, messageId: m.id, body: text.slice(0, 20000), displayName: names.get(m.from)})
      }
    }
  }
  return results
}

export function validFacebookOrigin(origin: string): boolean {
  return /^https:\/\/(?:[a-z0-9-]+\.)?facebook\.com$/.test(origin)
}
