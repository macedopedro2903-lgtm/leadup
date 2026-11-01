import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { effectivePlan, planLimits, currentPeriodStart } from '@/lib/plan'
import { FollowupsClient } from '@/components/app/followups-client'

export const dynamic = 'force-dynamic'

export default async function FollowupsPage({ searchParams }: { searchParams: Promise<{ leadId?: string }> }) {
  const user = await requireUser()
  const { leadId } = await searchParams
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, select: { id: true, name: true, phone: true } })

  const plan = effectivePlan(user)
  const { aiGenerations } = planLimits(plan)
  const used = await prisma.aiUsage.count({ where: { userId: user.id, type: 'followup', createdAt: { gte: currentPeriodStart() } } })
  const remaining = Math.max(0, aiGenerations - used)

  return <FollowupsClient leads={leads} initialLeadId={leadId} aiRemaining={remaining} />
}
