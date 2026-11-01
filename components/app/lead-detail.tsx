'use client'

import { ReminderSettings } from '@/components/app/reminder-settings'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadFormDialog, type LeadData } from '@/components/app/lead-form-dialog'
import { Pencil, MessageSquareText, Phone, CheckCircle2, ArrowLeft } from 'lucide-react'
import { formatBRL, LEAD_STATUS_LABEL, TONE_LABEL } from '@/lib/format'
import { buildWhatsappUrl } from '@/lib/whatsapp'

type Followup = { id: string; message: string; tone: string | null; generatedByAi: boolean; createdAt: string }
type Lead = {
  id: string; name: string; phone: string | null; service: string | null; value: number | null
  source:string;lastContactAt:string|null;followupEnabled:boolean;followupAfterDays:number;status: string; notes: string | null; nextFollowup: string | null; createdAt: string; updatedAt: string
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export function LeadDetail({ lead, followups, messages, activities }: { lead: Lead; followups: Followup[]; messages:{id:string;body:string;createdAt:string}[]; activities:{id:string;summary:string;createdAt:string}[] }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const [error,setError]=useState('')

  const wa = buildWhatsappUrl(lead.phone)

  async function markClosed() {
    setMarking(true)
    setError('')
    try {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'FECHADO' }),
    })
    setMarking(false)
    if (res.ok) router.refresh()
    else setError((await res.json()).error??'Falha ao atualizar status.')
    } catch {setError('Erro de conexão.')} finally {setMarking(false)}
  }

  const editData: LeadData = { id: lead.id, name: lead.name, phone: lead.phone, service: lead.service, value: lead.value, status: lead.status, notes: lead.notes, nextFollowup: lead.nextFollowup }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/app/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para leads
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold tracking-tight">{lead.name}</h1>
            <Badge variant="secondary">{LEAD_STATUS_LABEL[lead.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{lead.service || 'Sem serviço'} · {formatBRL(lead.value)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
        <Button asChild><Link href={`/app/followups?leadId=${lead.id}`}><MessageSquareText className="mr-2 h-4 w-4" /> Gerar follow-up</Link></Button>
        {wa ? (
          <Button asChild variant="outline"><a href={wa} target="_blank" rel="noopener noreferrer"><Phone className="mr-2 h-4 w-4" /> Abrir WhatsApp</a></Button>
        ) : (
          <Button variant="outline" disabled title="Lead sem WhatsApp"><Phone className="mr-2 h-4 w-4" /> Abrir WhatsApp</Button>
        )}
        {lead.status !== 'FECHADO' && (
          <Button variant="outline" onClick={markClosed} disabled={marking}><CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como fechado</Button>
        )}
      </div>

      {error&&<p role="alert" className="text-destructive">{error}</p>}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Origem</span><p className="font-medium">{lead.source}</p></div>
          <div><span className="text-muted-foreground">Última interação recebida</span><p className="font-medium">{lead.lastContactAt?fmtDateTime(lead.lastContactAt):'—'}</p></div>
          <div><span className="text-muted-foreground">Telefone</span><p className="font-medium">{lead.phone || '—'}</p></div>
          <div><span className="text-muted-foreground">Serviço</span><p className="font-medium">{lead.service || '—'}</p></div>
          <div><span className="text-muted-foreground">Valor</span><p className="font-medium">{formatBRL(lead.value)}</p></div>
          <div><span className="text-muted-foreground">Status</span><p className="font-medium">{LEAD_STATUS_LABEL[lead.status]}</p></div>
          <div><span className="text-muted-foreground">Próximo follow-up</span><p className="font-medium">{fmtDate(lead.nextFollowup)}</p></div>
          <div><span className="text-muted-foreground">Criado em</span><p className="font-medium">{fmtDate(lead.createdAt)}</p></div>
          <div className="sm:col-span-2"><span className="text-muted-foreground">Observações</span><p className="font-medium whitespace-pre-wrap">{lead.notes || '—'}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de follow-ups</CardTitle></CardHeader>
        <CardContent>
          {followups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum follow-up registrado ainda.</p>
          ) : (
            <ul className="space-y-4">
              {followups.map((f) => (
                <li key={f.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span>{fmtDateTime(f.createdAt)}</span>
                    {f.tone && <Badge variant="outline">{TONE_LABEL[f.tone] ?? f.tone}</Badge>}
                    {f.generatedByAi && <Badge variant="secondary">IA</Badge>}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Lembretes de acompanhamento</CardTitle></CardHeader><CardContent><ReminderSettings lead={lead}/></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Mensagens recebidas pelo WhatsApp</CardTitle></CardHeader><CardContent>{messages.length===0?<p className="text-sm text-muted-foreground">Nenhuma mensagem recebida pela integração.</p>:<ul className="space-y-3">{messages.map(m=><li key={m.id}><time className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</time><p className="text-sm whitespace-pre-wrap break-words">{m.body}</p></li>)}</ul>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Histórico comercial</CardTitle></CardHeader><CardContent><Link href="/app/orcamentos" className="text-sm text-primary underline">Gerenciar orçamentos</Link><ul className="space-y-3 mt-3">{activities.map(a=><li key={a.id}><time className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</time><p className="text-sm break-words">{a.summary}</p></li>)}</ul>{activities.length===0&&<p className="text-sm text-muted-foreground mt-3">Nenhuma alteração comercial registrada.</p>}</CardContent></Card>
      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={editData} onSaved={() => router.refresh()} />
    </div>
  )
}
