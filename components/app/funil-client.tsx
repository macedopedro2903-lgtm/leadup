'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { formatBRL, daysSince, LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from '@/lib/format'

type Lead = {
  id: string; name: string; service: string | null; value: number | null; status: string; updatedAt: string
}

const COLUMN_LABEL: Record<string, string> = {
  NOVO: 'Novos',
  PRIMEIRO_CONTATO: 'Primeiro contato',
  AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  ORCAMENTO_ENVIADO: 'Orçamento enviado',
  NEGOCIANDO: 'Negociando',
  FECHADO: 'Fechados',
  PERDIDO: 'Perdidos',
}

export function FunilClient({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [previousLeads,setPreviousLeads]=useState(initialLeads)
  if(previousLeads!==initialLeads){setPreviousLeads(initialLeads);setLeads(initialLeads)}
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changeStatus(id: string, status: string) {
    setSavingId(id)
    setError(null)
    const prev = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l)))
    try {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    setSavingId(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Não foi possível mover o lead. Tente novamente.')
      setLeads(prev)
      return
    }
    router.refresh()
    }catch{setError('Erro de conexão. Tente novamente.');setLeads(prev)}finally{setSavingId(null)}
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Funil</h1>
          </div>
          <Button asChild><Link href="/app/leads?novo=1"><Plus className="mr-2 h-4 w-4" /> Novo lead</Link></Button>
        </div>
        <Card><CardContent className="py-16 text-center">
          <p className="font-display text-lg font-semibold">Seu funil está vazio</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione seus leads e acompanhe cada oportunidade até o fechamento.</p>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Funil</h1>
          <p className="text-sm text-muted-foreground mt-1">Mova cada lead pelo seu estágio de venda.</p>
        </div>
        <Button asChild><Link href="/app/leads?novo=1"><Plus className="mr-2 h-4 w-4" /> Novo lead</Link></Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {LEAD_STATUS_ORDER.map((col) => {
          const colLeads = leads.filter((l) => l.status === col)
          const total = colLeads.reduce((s, l) => s + (l.value ?? 0), 0)
          return (
            <div key={col} className="w-72 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-semibold text-sm">{COLUMN_LABEL[col]}</h2>
                <span className="text-xs text-muted-foreground">{colLeads.length}</span>
              </div>
              <div className="space-y-3">
                {colLeads.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Nenhum lead</div>
                ) : (
                  colLeads.map((l) => {
                    const d = daysSince(l.updatedAt)
                    return (
                      <Card key={l.id} className="shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <Link href={`/app/leads/${l.id}`} className="font-medium text-sm hover:underline block truncate">{l.name}</Link>
                          <p className="text-xs text-muted-foreground">{l.service || 'Sem serviço'}</p>
                          <p className="text-sm font-semibold">{formatBRL(l.value)}</p>
                          <p className="text-[11px] text-muted-foreground">{d === 0 ? 'Atualizado hoje' : `há ${d} ${d === 1 ? 'dia' : 'dias'}`}</p>
                          <Select value={l.status} onValueChange={(v) => changeStatus(l.id, v)} disabled={savingId === l.id}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
                {colLeads.length > 0 && (
                  <p className="text-[11px] text-muted-foreground px-1">Total: {formatBRL(total)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
