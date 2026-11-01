'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABEL } from '@/lib/format'

export type LeadData = {
  id?: string
  name: string
  phone?: string | null
  service?: string | null
  value?: number | null
  status: string
  notes?: string | null
  nextFollowup?: string | null
}

function toDateInput(d?: string | null): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  lead?: LeadData | null
  onSaved: () => void
}) {
  const editing = !!lead?.id
  const [form, setForm] = useState<LeadData>({ name: '', phone: '', service: '', value: null, status: 'NOVO', notes: '', nextFollowup: '' })
  const [valueStr, setValueStr] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setError(null)
      if (lead) {
        setForm({ ...lead })
        setValueStr(lead.value != null ? String(lead.value).replace('.', ',') : '')
      } else {
        setForm({ name: '', phone: '', service: '', value: null, status: 'NOVO', notes: '', nextFollowup: '' })
        setValueStr('')
      }
    }
  }, [open, lead])

  function update<K extends keyof LeadData>(key: K, value: LeadData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) { setError('Informe o nome do lead.'); return }
    if (!form.phone?.trim()) { setError('Informe o WhatsApp do lead.'); return }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        service: form.service,
        value: valueStr,
        status: form.status,
        notes: form.notes,
        nextFollowup: form.nextFollowup || null,
      }
      const url = editing ? `/api/leads/${lead!.id}` : '/api/leads'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Não foi possível salvar. Tente novamente.')
        setLoading(false)
        return
      }
      setLoading(false)
      onOpenChange(false)
      onSaved()
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar lead' : 'Novo lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Nome *</Label>
            <Input id="lead-name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-phone">WhatsApp *</Label>
            <Input id="lead-phone" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="(11) 99999-9999" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-service">Serviço</Label>
              <Input id="lead-service" value={form.service ?? ''} onChange={(e) => update('service', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-value">Valor estimado</Label>
              <Input id="lead-value" inputMode="decimal" value={valueStr} onChange={(e) => setValueStr(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-followup">Próximo follow-up</Label>
              <Input id="lead-followup" type="date" value={toDateInput(form.nextFollowup)} onChange={(e) => update('nextFollowup', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Observações</Label>
            <Textarea id="lead-notes" value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} rows={3} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Salvar' : 'Criar lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
