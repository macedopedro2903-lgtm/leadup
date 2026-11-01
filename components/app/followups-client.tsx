'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, RefreshCw, Phone, Save, Check, Loader2 } from 'lucide-react'
import { buildWhatsappUrl } from '@/lib/whatsapp'

type Lead = { id: string; name: string; phone: string | null }

export function FollowupsClient({
  leads,
  initialLeadId,
  aiRemaining,
}: {
  leads: Lead[]
  initialLeadId?: string
  aiRemaining: number
}) {
  const router = useRouter()
  const [leadId, setLeadId] = useState<string>(initialLeadId && leads.some((l) => l.id === initialLeadId) ? initialLeadId : '')
  const [tone, setTone] = useState('AMIGAVEL')
  const [message, setMessage] = useState('')
  const [generatedByAi, setGeneratedByAi] = useState(false)
  const [remaining, setRemaining] = useState(aiRemaining)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const selectedLead = leads.find((l) => l.id === leadId)

  async function generate() {
    if (!leadId) { setError('Selecione um lead primeiro.'); return }
    setError(null)
    setSaved(false)
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/followup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, tone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Não conseguimos gerar sua mensagem agora. Tente novamente ou escreva manualmente.')
        setGenerating(false)
        return
      }
      setMessage(data.message)
      setGeneratedByAi(true)
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      setGenerating(false)
    } catch {
      setError('Não conseguimos gerar sua mensagem agora. Você pode escrever uma mensagem manualmente ou tentar novamente.')
      setGenerating(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  async function save() {
    if (!leadId) { setError('Selecione um lead primeiro.'); return }
    if (!message.trim()) { setError('Escreva ou gere uma mensagem antes de salvar.'); return }
    setError(null)
    setSaving(true)
    try {
    const res = await fetch('/api/followups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, message, tone, generatedByAi }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Não foi possível salvar. Tente novamente.')
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
    }catch{setError('Erro de conexão. Sua mensagem continua disponível para tentar novamente.')}finally{setSaving(false)}
  }

  const waUrl = selectedLead ? buildWhatsappUrl(selectedLead.phone, message) : ''

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Follow-ups</h1>
        <Card><CardContent className="py-16 text-center">
          <p className="font-display text-lg font-semibold">Nenhum lead ainda</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Cadastre um lead para gerar follow-ups.</p>
          <Button asChild><Link href="/app/leads?novo=1">Adicionar primeiro lead</Link></Button>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground mt-1">Gere uma sugestão com IA ou escreva manualmente. Nada é enviado automaticamente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Gerar mensagem</span>
            <Badge variant="secondary">{remaining} gerações de IA restantes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMIGAVEL">Amigável</SelectItem>
                  <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                  <SelectItem value="DIRETO">Direto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generate} disabled={generating || !leadId} className="w-full sm:w-auto">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {generating ? 'Gerando...' : 'Gerar follow-up'}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="msg">Mensagem (edite antes de enviar)</Label>
            <Textarea id="msg" rows={6} value={message} onChange={(e) => { setMessage(e.target.value); setGeneratedByAi(false) }} placeholder="A mensagem gerada aparece aqui. Você também pode escrever manualmente." />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-primary flex items-center"><Check className="mr-1 h-4 w-4" /> Salvo no histórico do lead.</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copy} disabled={!message.trim()}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button type="button" variant="outline" onClick={generate} disabled={generating || !leadId}>
              <RefreshCw className="mr-2 h-4 w-4" /> Gerar novamente
            </Button>
            {waUrl ? (
              <Button asChild type="button" variant="outline" disabled={!message.trim()}>
                <a href={message.trim() ? waUrl : undefined} target="_blank" rel="noopener noreferrer"><Phone className="mr-2 h-4 w-4" /> Abrir no WhatsApp</a>
              </Button>
            ) : (
              <Button type="button" variant="outline" disabled title="Lead sem WhatsApp"><Phone className="mr-2 h-4 w-4" /> Abrir no WhatsApp</Button>
            )}
            <Button type="button" onClick={save} disabled={saving || !message.trim() || !leadId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar no histórico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
