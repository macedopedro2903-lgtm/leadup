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

  const followups = await prisma.followup.findMany({ where: { leadId: id, userId: user.id }, orderBy: { createdAt: 'desc' } })

  const [messages,activities]=await Promise.all([prisma.leadMessage.findMany({where:{userId:user.id,leadId:id},orderBy:{receivedAt:'desc'},take:100}),prisma.leadActivity.findMany({where:{userId:user.id,leadId:id},orderBy:{createdAt:'desc'},take:100})])

  return (
    <LeadDetail key={lead.updatedAt.toISOString()}
      messages={messages.map(m=>({id:m.id,body:m.body,createdAt:m.receivedAt.toISOString()}))}
      activities={activities.map(a=>({id:a.id,summary:a.summary,createdAt:a.createdAt.toISOString()}))}
      lead={{
        id: lead.id, name: lead.name, phone: lead.phone, service: lead.service, value: lead.value,
        status: lead.status, notes: lead.notes, source:lead.source, lastContactAt:lead.lastContactAt?.toISOString()??null, followupEnabled:lead.followupEnabled,followupAfterDays:lead.followupAfterDays,
        nextFollowup: lead.nextFollowup ? lead.nextFollowup.toISOString() : null,
        createdAt: lead.createdAt.toISOString(), updatedAt: lead.updatedAt.toISOString(),
      }}
      followups={followups.map((f) => ({ id: f.id, message: f.message, tone: f.tone, generatedByAi: f.generatedByAi, createdAt: f.createdAt.toISOString() }))}
    />
  )
}
