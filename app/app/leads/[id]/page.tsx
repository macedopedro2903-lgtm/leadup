import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { LeadDetail } from '@/components/app/lead-detail'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead || lead.userId !== user.id) notFound()

  const followups = await prisma.followup.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } })

  return (
    <LeadDetail
      lead={{
        id: lead.id, name: lead.name, phone: lead.phone, service: lead.service, value: lead.value,
        status: lead.status, notes: lead.notes,
        nextFollowup: lead.nextFollowup ? lead.nextFollowup.toISOString() : null,
        createdAt: lead.createdAt.toISOString(), updatedAt: lead.updatedAt.toISOString(),
      }}
      followups={followups.map((f) => ({ id: f.id, message: f.message, tone: f.tone, generatedByAi: f.generatedByAi, createdAt: f.createdAt.toISOString() }))}
    />
  )
}
