/** Formata valor em BRL. */
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Dias inteiros desde uma data até agora (>=0). */
export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export const LEAD_STATUS_LABEL: Record<string, string> = {
  NOVO: 'Novo lead',
  PRIMEIRO_CONTATO: 'Primeiro contato',
  AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  NEGOCIANDO: 'Negociando',
  FECHADO: 'Fechado',
  PERDIDO: 'Perdido',
}

export const LEAD_STATUS_ORDER = ['NOVO', 'PRIMEIRO_CONTATO', 'ORCAMENTO_ENVIADO', 'NEGOCIANDO', 'AGUARDANDO_RESPOSTA', 'FECHADO', 'PERDIDO'] as const

export const TONE_LABEL: Record<string, string> = {
  AMIGAVEL: 'Amigável',
  PROFISSIONAL: 'Profissional',
  DIRETO: 'Direto',
}
