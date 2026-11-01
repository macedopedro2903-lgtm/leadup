/** Canonical Brazilian WhatsApp telephone; returns empty for invalid values. */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  let digits = String(raw).replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits
  if (!/^55[1-9][0-9][2-9][0-9]{7,8}$/.test(digits)) return ''
  return digits
}

export function buildWhatsappUrl(phone: string | null | undefined, message?: string): string {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  const base = `https://wa.me/${digits}`
  return message?.trim() ? `${base}?text=${encodeURIComponent(message)}` : base
}
