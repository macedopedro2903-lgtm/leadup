import Link from 'next/link'
import { requireAdmin } from '@/lib/session'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminClient } from '@/components/admin/admin-client'
import { Users, Crown, UserCheck, ClipboardList, MessageSquareText, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  await requireAdmin()

  const now = new Date()
  const [totalUsers, startUsers, leadsCount, followupsCount, pendingRequests, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: 'START', planStatus: 'ACTIVE', OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] } }),
    prisma.lead.count(),
    prisma.followup.count({ where: { generatedByAi: true } }),
    prisma.planRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, businessName: true, plan: true, planStatus: true,
        planExpiresAt: true, isAdmin: true, createdAt: true, _count: { select: { leads: true } },
      },
    }),
  ])
  const freeUsers = totalUsers - startUsers

  const metrics = [
    { label: 'Total de usuários', value: totalUsers, icon: Users },
    { label: 'Usuários Free', value: freeUsers, icon: UserCheck },
    { label: 'Usuários Start', value: startUsers, icon: Crown },
    { label: 'Leads cadastrados', value: leadsCount, icon: ClipboardList },
    { label: 'Follow-ups por IA', value: followupsCount, icon: MessageSquareText },
    { label: 'Solicitações pendentes', value: pendingRequests, icon: ClipboardList },
  ]

  const serializedUsers = users.map((u) => ({
    id: u.id, name: u.name, email: u.email, businessName: u.businessName,
    plan: u.plan, planStatus: u.planStatus,
    planExpiresAt: u.planExpiresAt ? u.planExpiresAt.toISOString() : null,
    isAdmin: u.isAdmin, createdAt: u.createdAt.toISOString(), leadCount: u._count.leads,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Painel administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie usuários e planos do LeadUp.</p>
          </div>
          <Button asChild variant="outline"><Link href="/app"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao app</Link></Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <Card key={m.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{m.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold font-display">{m.value}</div></CardContent>
              </Card>
            )
          })}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Usuários</h2>
          <AdminClient initialUsers={serializedUsers} />
        </div>
      </div>
    </div>
  )
}
