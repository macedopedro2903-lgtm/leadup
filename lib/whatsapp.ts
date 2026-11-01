/**
 * Normaliza um telefone brasileiro para o formato aceito pelo wa.me (somente dígitos, com DDI).
 * - Remove tudo que não for dígito.
 * - Se não começar com 55 e tiver 10 ou 11 dígitos (DDD + número), prefixa 55.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = '55' + digits
  }
  return digits
}

/** Monta o link wa.me com mensagem pré-preenchida e codificada. Retorna '' se telefone inválido. */
export function buildWhatsappUrl(phone: string | null | undefined, message?: string): string {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  const base = `https://wa.me/${digits}`
  if (message && message.trim()) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}
