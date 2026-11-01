import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { LeadsClient } from '@/components/app/leads-client'

export const dynamic = 'force-dynamic'

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  const user = await requireUser()
  const { novo } = await searchParams
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })

  const serialized = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    service: l.service,
    value: l.value,
    status: l.status,
    nextFollowup: l.nextFollowup ? l.nextFollowup.toISOString() : null,
    updatedAt: l.updatedAt.toISOString(),
  }))

  return <LeadsClient initialLeads={serialized} openNew={novo === '1'} />
}
