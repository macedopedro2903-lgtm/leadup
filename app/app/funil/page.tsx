import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { FunilClient } from '@/components/app/funil-client'

export const dynamic = 'force-dynamic'

export default async function FunilPage() {
  const user = await requireUser()
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })
  const serialized = leads.map((l) => ({
    id: l.id, name: l.name, service: l.service, value: l.value, status: l.status, updatedAt: l.updatedAt.toISOString(),
  }))
  return <FunilClient initialLeads={serialized} />
}
