'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Search } from 'lucide-react'

type AdminUser = {
  id: string; name: string | null; email: string; businessName: string | null
  plan: string; planStatus: string; planExpiresAt: string | null; isAdmin: boolean
  createdAt: string; leadCount: number
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

export function AdminClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [activateUser, setActivateUser] = useState<AdminUser | null>(null)
  const [startDate, setStartDate] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users.map((u: any) => ({ ...u, leadCount: u._count?.leads ?? 0 })))
    }
    router.refresh()
  }

  async function doAction(id: string, action: string, extra?: Record<string, unknown>) {
    setBusyId(id)
    setError(null)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }),
    })
    setBusyId(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d?.error ?? 'Erro ao atualizar usuário.'); return false }
    await refresh()
    return true
  }

  async function confirmActivate() {
    if (!activateUser) return
    const ok = await doAction(activateUser.id, 'ACTIVATE_START', { startDate: startDate || null, expiresAt: expiresAt || null })
    if (ok) { setActivateUser(null); setStartDate(''); setExpiresAt('') }
  }

  const filtered = users.filter((u) =>
    !search.trim() ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.businessName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar usuário..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium whitespace-nowrap">{u.name || '—'}{u.isAdmin && <Badge variant="outline" className="ml-2">admin</Badge>}</TableCell>
                  <TableCell className="whitespace-nowrap">{u.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{u.businessName || '—'}</TableCell>
                  <TableCell><Badge variant={u.plan === 'START' ? 'default' : 'secondary'}>{u.plan}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.planStatus === 'ACTIVE' ? 'default' : u.planStatus === 'SUSPENDED' ? 'destructive' : 'secondary'}>{u.planStatus}</Badge>
                    {u.plan === 'START' && u.planExpiresAt && <div className="text-xs text-muted-foreground mt-1">até {fmtDate(u.planExpiresAt)}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDate(u.createdAt)}</TableCell>
                  <TableCell>{u.leadCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => { setActivateUser(u); setStartDate(''); setExpiresAt('') }}>Ativar Start</Button>
                      {u.plan === 'START' && <Button size="sm" variant="ghost" disabled={busyId === u.id} onClick={() => doAction(u.id, 'DEACTIVATE_START')}>Desativar</Button>}
                      {u.planStatus !== 'SUSPENDED'
                        ? <Button size="sm" variant="ghost" disabled={busyId === u.id} onClick={() => doAction(u.id, 'SUSPEND')}>Suspender</Button>
                        : <Button size="sm" variant="ghost" disabled={busyId === u.id} onClick={() => doAction(u.id, 'REACTIVATE')}>Reativar</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!activateUser} onOpenChange={(v) => !v && setActivateUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ativar Start — {activateUser?.name || activateUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Data de início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Data de expiração</Label><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Deixe a expiração em branco para um plano sem data de término.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateUser(null)}>Cancelar</Button>
            <Button onClick={confirmActivate} disabled={busyId === activateUser?.id}>
              {busyId === activateUser?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ativar Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
