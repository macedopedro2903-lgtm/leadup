'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { LeadFormDialog, type LeadData } from '@/components/app/lead-form-dialog'
import { Plus, Search, Pencil, Trash2, Eye, MessageSquareText, FileUp } from 'lucide-react'
import { formatBRL, daysSince, LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from '@/lib/format'
import { buildWhatsappUrl } from '@/lib/whatsapp'

type Lead = {
  id: string
  name: string
  phone: string | null
  service: string | null
  value: number | null
  status: string
  nextFollowup: string | null
  updatedAt: string
}

export function LeadsClient({ initialLeads, openNew }: { initialLeads: Lead[]; openNew?: boolean }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [formOpen, setFormOpen] = useState(!!openNew)
  const [editLead, setEditLead] = useState<LeadData | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/leads')
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads)
    }
    router.refresh()
  }, [router])

  const filtered = useMemo(() => {
    let list = leads
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((l) => l.name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((l) => l.status === statusFilter)
    }
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [leads, search, statusFilter])

  function openEdit(l: Lead) {
    setEditLead({ id: l.id, name: l.name, phone: l.phone, service: l.service, value: l.value, status: l.status, nextFollowup: l.nextFollowup })
    setFormOpen(true)
  }

  function openCreate() {
    setEditLead(null)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/leads/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas oportunidades.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/app/importar"><FileUp className="mr-2 h-4 w-4" /> Importar leads</Link></Button><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo lead</Button></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {LEAD_STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {leads.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-lg font-semibold">Seu primeiro cliente começa aqui.</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Cadastre um lead para começar.</p>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Adicionar primeiro lead</Button>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum lead encontrado com esses filtros.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const d = daysSince(l.updatedAt)
            const wa = buildWhatsappUrl(l.phone)
            return (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/app/leads/${l.id}`} className="font-semibold hover:underline truncate">{l.name}</Link>
                        <Badge variant="secondary">{LEAD_STATUS_LABEL[l.status]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {l.service || 'Sem serviço'} · {formatBRL(l.value)}
                        {l.phone ? ` · ${l.phone}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Atualizado {d === 0 ? 'hoje' : `há ${d} ${d === 1 ? 'dia' : 'dias'}`}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button asChild variant="ghost" size="icon" title="Ver detalhes"><Link href={`/app/leads/${l.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      <Button asChild variant="ghost" size="icon" title="Gerar follow-up"><Link href={`/app/followups?leadId=${l.id}`}><MessageSquareText className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteId(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editLead} onSaved={refresh} />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O histórico de follow-ups deste lead também será removido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete() }} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
