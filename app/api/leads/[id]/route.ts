import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { effectivePlan, planLimits, ACTIVE_LEAD_STATUSES } from '@/lib/plan'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional().nullable(),
  service: z.string().trim().optional().nullable(),
  value: z.union([z.number(), z.string(), z.null()]).optional(),
  status: z.enum(['NOVO', 'ORCAMENTO_ENVIADO', 'NEGOCIANDO', 'FECHADO', 'PERDIDO']).optional(),
  notes: z.string().trim().optional().nullable(),
  nextFollowup: z.string().optional().nullable(),
})

function parseValue(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  const cleaned = String(v).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

async function ownLead(userId: string, id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead || lead.userId !== userId) return null
  return lead
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { id } = await params
  const lead = await ownLead(userId, id)
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
  const followups = await prisma.followup.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ lead, followups })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { id } = await params
  const lead = await ownLead(userId, id)
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const data = parsed.data

  // Se está reativando um lead (de FECHADO/PERDIDO para ativo), respeitar limite Free.
  if (data.status && (ACTIVE_LEAD_STATUSES as readonly string[]).includes(data.status)) {
    const wasActive = (ACTIVE_LEAD_STATUSES as readonly string[]).includes(lead.status)
    if (!wasActive) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        const plan = effectivePlan(user)
        const { activeLeadsLimit } = planLimits(plan)
        if (activeLeadsLimit !== Infinity) {
          const activeCount = await prisma.lead.count({
            where: { userId, status: { in: ACTIVE_LEAD_STATUSES as unknown as any } },
          })
          if (activeCount >= activeLeadsLimit) {
            return NextResponse.json(
              { error: `Você atingiu o limite de ${activeLeadsLimit} leads ativos do plano grátis.`, code: 'LEAD_LIMIT' },
              { status: 403 }
            )
          }
        }
      }
    }
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.service !== undefined ? { service: data.service || null } : {}),
      ...(data.value !== undefined ? { value: parseValue(data.value) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.nextFollowup !== undefined ? { nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : null } : {}),
    },
  })
  return NextResponse.json({ lead: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { id } = await params
  const lead = await ownLead(userId, id)
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
