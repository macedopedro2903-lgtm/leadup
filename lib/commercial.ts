import { ACTIVE_LEAD_STATUSES } from '@/lib/plan'

type AttentionLead = {status:string;followupEnabled:boolean;followupAfterDays:number;nextFollowup:Date|null;lastContactAt:Date|null;createdAt:Date}
export function attentionReason(lead: AttentionLead, now = new Date()): string | null {
  if (!lead.followupEnabled || !(ACTIVE_LEAD_STATUSES as readonly string[]).includes(lead.status)) return null
  if (lead.nextFollowup && lead.nextFollowup <= now) return 'Acompanhamento agendado vencido'
  if (lead.nextFollowup) return null
  const last = lead.lastContactAt ?? lead.createdAt
  return now.getTime() - last.getTime() >= lead.followupAfterDays * 86400000 ? 'Sem interação recente' : null
}

export const QUOTE_LABEL: Record<string,string> = {RASCUNHO:'Rascunho',ENVIADO:'Enviado',ACEITO:'Aceito',RECUSADO:'Recusado'}
