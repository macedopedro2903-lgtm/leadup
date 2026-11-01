import Link from 'next/link'
import { attentionReason } from '@/lib/commercial'
import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { ACTIVE_LEAD_STATUSES } from '@/lib/plan'
import { formatBRL, daysSince, LEAD_STATUS_LABEL } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Wallet, CheckCircle2, CalendarClock, Handshake, Plus, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser()
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })

  const active = leads.filter((l) => (ACTIVE_LEAD_STATUSES as readonly string[]).includes(l.status))
  const closed = leads.filter((l) => l.status === 'FECHADO')
  const negotiating = leads.filter((l) => l.status === 'NEGOCIANDO')

  const openValue = active.reduce((sum, l) => sum + (l.value ?? 0), 0)
  const closedValue = closed.reduce((sum, l) => sum + (l.value ?? 0), 0)

  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const followupsToday = leads.filter(
    (l) => l.nextFollowup && l.nextFollowup.getTime() <= endOfToday.getTime() && (ACTIVE_LEAD_STATUSES as readonly string[]).includes(l.status)
  )

  // Precisa da sua atenção: follow-up vencido ou para hoje (apenas leads ativos)
  const needsAttention = leads.filter(l=>attentionReason(l, now))
    .slice()
    .sort((a, b) => (a.nextFollowup?.getTime() ?? a.createdAt.getTime()) - (b.nextFollowup?.getTime() ?? b.createdAt.getTime()))

  const cards = [
    { label: 'Novos leads', value: String(leads.filter(l=>l.status==='NOVO').length), icon: Users },
    { label: 'Orçamentos enviados', value: String(await prisma.quote.count({where:{userId:user.id,status:'ENVIADO'}})), icon: Wallet },
    { label: 'Vendas concluídas', value: String(closed.length), icon: CheckCircle2 },
    { label: 'Taxa de conversão', value: `${leads.length ? (100*closed.length/leads.length).toFixed(1) : '0'}%`, icon: Handshake },
    { label: 'Leads ativos', value: String(active.length), icon: Users },
    { label: 'Valor em oportunidades abertas', value: formatBRL(openValue), icon: Wallet },
    { label: 'Valor fechado', value: formatBRL(closedValue), icon: CheckCircle2 },
    { label: 'Follow-ups para hoje', value: String(followupsToday.length), icon: CalendarClock },
    { label: 'Negociações em andamento', value: String(negotiating.length), icon: Handshake },
  ]

  const firstName = (user.name ?? '').split(' ')[0] || user.email

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Olá, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe suas oportunidades e não perca nenhum follow-up. Atualização automática a cada 15 segundos.</p>
        </div>
        <Button asChild>
          <Link href="/app/leads?novo=1"><Plus className="mr-2 h-4 w-4" /> Novo lead</Link>
        </Button>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-display text-lg font-semibold">Seu primeiro cliente começa aqui.</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Cadastre um lead para começar a acompanhar suas vendas.</p>
            <Button asChild>
              <Link href="/app/leads?novo=1"><Plus className="mr-2 h-4 w-4" /> Adicionar primeiro lead</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((c) => {
              const Icon = c.icon
              return (
                <Card key={c.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{c.label}</CardTitle>
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold font-display">{c.value}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Precisa da sua atenção</h2>
            </div>
            {needsAttention.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum follow-up pendente para hoje. Tudo em dia!</CardContent></Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {needsAttention.map((l) => {
                  const d = daysSince(l.lastContactAt ?? l.createdAt)
                  const overdue = l.nextFollowup && l.nextFollowup.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
                  return (
                    <Card key={l.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{l.name}</p>
                            <p className="text-sm text-muted-foreground">{formatBRL(l.value)}</p>
                          </div>
                          <Badge variant={overdue ? 'destructive' : 'secondary'}>{LEAD_STATUS_LABEL[l.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {d === 0 ? 'Interação hoje' : `${d} ${d === 1 ? 'dia' : 'dias'} sem interação`}
                           · {attentionReason(l,now)}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={`/app/leads/${l.id}`}>Ver lead</Link>
                          </Button>
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/app/followups?leadId=${l.id}`}>Gerar follow-up</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
