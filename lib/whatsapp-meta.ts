import 'server-only'
import { tokenKey, encryptMetaToken, decryptMetaToken } from '@/lib/whatsapp-meta-core'

export function publicMetaSettings() {
  const appId = process.env.META_APP_ID ?? ''
  const configId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID ?? ''
  const version = process.env.META_GRAPH_API_VERSION ?? ''
  let validKey = false
  try { tokenKey(process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY); validKey = true } catch {}
  const ready = /^\d+$/.test(appId) && /^\d+$/.test(configId) && /^v\d+\.\d+$/.test(version) &&
    Boolean(process.env.META_APP_SECRET && process.env.META_WEBHOOK_VERIFY_TOKEN && validKey)
  return {appId, configId, version, ready}
}

function graphBase() {
  const version = process.env.META_GRAPH_API_VERSION
  if (!version || !/^v\d+\.\d+$/.test(version)) throw new Error('META_GRAPH_API_VERSION missing/invalid')
  return `https://graph.facebook.com/${version}`
}

/** No Meta token or response body is copied into exceptions/logs. */
export async function metaGraph<T>(endpoint: string, accessToken: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  if (!/^\/[A-Za-z0-9_/.?-]+(?:&[A-Za-z0-9_=&,.%-]+)*$/.test(endpoint)) throw new Error('Invalid Graph endpoint')
  const response = await fetch(`${graphBase()}${endpoint}`, {
    method,
    headers: {Authorization: `Bearer ${accessToken}`, ...(body ? {'Content-Type':'application/json'} : {})},
    ...(body ? {body:JSON.stringify(body)} : {}),
    cache:'no-store', signal:AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`Meta Graph API request failed (${response.status})`)
  return await response.json() as T
}

export async function exchangeSignupCode(code: string): Promise<string> {
  const {META_APP_ID:appId,META_APP_SECRET:secret} = process.env
  if (!appId || !secret) throw new Error('Meta configuration missing')
  const params = new URLSearchParams({client_id: appId,client_secret:secret,code})
  const response = await fetch(`${graphBase()}/oauth/access_token?${params}`, {cache:'no-store',signal:AbortSignal.timeout(12000)})
  // Never log the URL: it contains an app secret.
  if (!response.ok) throw new Error(`Meta authorization failed (${response.status})`)
  const json:unknown = await response.json()
  const token = (json as {access_token?:unknown}).access_token
  if (typeof token !== 'string' || token.length < 10) throw new Error('Meta did not return a valid token')
  return token
}

export async function verifyPhoneInWaba(wabaId: string, phoneNumberId: string, token: string): Promise<string> {
  const result = await metaGraph<{data?:Array<{id:string;display_phone_number?:string}>}>(
    `/${wabaId}/phone_numbers?fields=id,display_phone_number&limit=100`, token)
  const phone = result.data?.find(item=>item.id === phoneNumberId)
  if (!phone) throw new Error('WhatsApp number is not authorized in the selected business account')
  return phone.display_phone_number ?? ''
}

export function encryptStoredToken(token: string): string {
  return encryptMetaToken(token,tokenKey(process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY))
}
export function decryptStoredToken(token: string): string {
  return decryptMetaToken(token,tokenKey(process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY))
}
