import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { effectivePlan, planLimits, currentPeriodStart } from '@/lib/plan'
import { generateFollowupMessage } from '@/lib/llm'
import { daysSince } from '@/lib/format'

export const dynamic = 'force-dynamic'

const schema = z.object({
  leadId: z.string().min(1),
  tone: z.enum(['AMIGAVEL', 'PROFISSIONAL', 'DIRETO']).default('AMIGAVEL'),
})

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  const { leadId, tone } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead || lead.userId !== userId) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
  }

  // Verificar limite de IA do período atual
  const plan = effectivePlan(user)
  const { aiGenerations } = planLimits(plan)
  const used = await prisma.aiUsage.count({
    where: { userId, type: 'followup', createdAt: { gte: currentPeriodStart() } },
  })
  if (used >= aiGenerations) {
    return NextResponse.json(
      { error: 'Você atingiu seu limite de mensagens inteligentes.', code: 'AI_LIMIT' },
      { status: 403 }
    )
  }

  try {
    const message = await generateFollowupMessage({
      leadName: lead.name,
      service: lead.service,
      value: lead.value,
      status: lead.status,
      daysSinceContact: daysSince(lead.updatedAt),
      notes: lead.notes,
      tone,
      businessName: user.businessName,
    })

    // Registrar uso somente após sucesso
    await prisma.aiUsage.create({ data: { userId, type: 'followup' } })

    const remaining = Math.max(0, aiGenerations - (used + 1))
    return NextResponse.json({ message, remaining })
  } catch (err) {
    console.error('[ai/followup] error', err)
    return NextResponse.json(
      {
        error: 'Não conseguimos gerar sua mensagem agora. Você pode escrever uma mensagem manualmente ou tentar novamente.',
        code: 'AI_ERROR',
      },
      { status: 502 }
    )
  }
}
