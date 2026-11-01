'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Crown, LogOut, Phone } from 'lucide-react'
import { WhatsAppConnectionCard } from '@/components/app/whatsapp-connection-card'

type Props = {
  user: { name: string; email: string; businessName: string; whatsapp: string }
  planLabel: string
  planExpiresAt: string | null
  aiUsed: number
  aiLimit: number
  isStart: boolean
  startPrice: string
  launchPrice: string
  whatsappSalesNumber: string
}

export function ConfiguracoesClient(props: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState({ name: props.user.name, businessName: props.user.businessName, whatsapp: props.user.whatsapp })
  const [editOpen, setEditOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)

  const [savingProfile, setSavingProfile] = useState(false)
  const [profileErr, setProfileErr] = useState<string | null>(null)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)

  const [subErr, setSubErr] = useState<string | null>(null)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileErr(null)
    setSavingProfile(true)
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    setSavingProfile(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setProfileErr(d?.error ?? 'Erro ao salvar.'); return }
    setEditOpen(false)
    router.refresh()
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErr(null); setPwOk(false)
    setSavingPw(true)
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pw) })
    setSavingPw(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setPwErr(d?.error ?? 'Erro ao alterar senha.'); return }
    setPwOk(true)
    setPw({ currentPassword: '', newPassword: '' })
  }

  function subscribe() {
    setSubErr(null)
    const number = (props.whatsappSalesNumber || '').replace(/\D/g, '')
    if (!number) {
      setSubErr('WHATSAPP_SALES_NUMBER ainda não foi configurado.')
      return
    }
    const msg = [
      'Olá! Quero assinar o plano Start do LeadUp.',
      '',
      `Nome: ${props.user.name || '—'}`,
      `Empresa: ${props.user.businessName || '—'}`,
      `E-mail cadastrado: ${props.user.email}`,
      '',
      `Valor de lançamento: R$ ${props.launchPrice} no primeiro mês.`,
      `Depois: R$ ${props.startPrice}/mês.`,
      '',
      'Gostaria de receber as instruções para pagamento via PIX.',
    ].join('\n')
    const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
    // Abre direto a partir do gesto de clique (sem await antes) para não ser bloqueado pelo navegador.
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) {
      // Fallback: alguns navegadores/celulares bloqueiam nova aba — navega na própria aba.
      window.location.href = url
    }
    // Registra a solicitação em segundo plano, sem bloquear o redirecionamento.
    fetch('/api/plan-request', { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Perfil</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Nome</span><p className="font-medium">{props.user.name || '—'}</p></div>
          <div><span className="text-muted-foreground">Empresa</span><p className="font-medium">{props.user.businessName || '—'}</p></div>
          <div><span className="text-muted-foreground">E-mail</span><p className="font-medium">{props.user.email}</p></div>
          <div><span className="text-muted-foreground">WhatsApp</span><p className="font-medium">{props.user.whatsapp || '—'}</p></div>
          <div className="sm:col-span-2 flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>Editar perfil</Button>
            <Button variant="outline" onClick={() => { setPwOk(false); setPwErr(null); setPwOpen(true) }}>Alterar senha</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Plano</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Plano atual:</span>
            <Badge variant={props.isStart ? 'default' : 'secondary'}>{props.planLabel}</Badge>
          </div>
          {props.planExpiresAt && <p><span className="text-muted-foreground">Expira em:</span> <span className="font-medium">{props.planExpiresAt}</span></p>}
          <p><span className="text-muted-foreground">Uso de IA no mês:</span> <span className="font-medium">{props.aiUsed} de {props.aiLimit}</span></p>
          <div className="pt-2">
            <Button onClick={() => { setSubErr(null); setSubOpen(true) }}>
              <Crown className="mr-2 h-4 w-4" /> {props.isStart ? 'Renovar Start' : 'Assinar Start'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </CardContent>
      </Card>

      {/* WhatsApp oficial — autorização individual de cada usuário */}
      <WhatsAppConnectionCard />

      {/* Editar perfil */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Empresa</Label><Input value={profile.businessName} onChange={(e) => setProfile((p) => ({ ...p, businessName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={profile.whatsapp} onChange={(e) => setProfile((p) => ({ ...p, whatsapp: e.target.value }))} /></div>
            {profileErr && <p className="text-sm text-destructive">{profileErr}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingProfile}>{savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alterar senha */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="space-y-2"><Label>Senha atual</Label><Input type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Nova senha</Label><Input type="password" minLength={6} value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} required /></div>
            {pwErr && <p className="text-sm text-destructive">{pwErr}</p>}
            {pwOk && <p className="text-sm text-primary">Senha alterada com sucesso.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwOpen(false)}>Fechar</Button>
              <Button type="submit" disabled={savingPw}>{savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Alterar senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assinar Start */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>LeadUp Start</DialogTitle>
            <DialogDescription>Primeiro mês: R$ {props.launchPrice} · Depois: R$ {props.startPrice}/mês</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">O pagamento inicial será combinado pelo WhatsApp. Após a confirmação, seu plano será ativado.</p>
            {subErr && <p className="text-sm text-destructive">{subErr}</p>}
            <Button className="w-full" onClick={subscribe}>
              <Phone className="mr-2 h-4 w-4" />
              ASSINAR PELO WHATSAPP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
