import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
import { effectivePlan, planLimits, ACTIVE_LEAD_STATUSES } from '@/lib/plan'

export const dynamic = 'force-dynamic'

const leadSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do lead.'),
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

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const leads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ leads })
}

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const data = parsed.data
  const status = data.status ?? 'NOVO'
  const isActive = (ACTIVE_LEAD_STATUSES as readonly string[]).includes(status)

  if (isActive) {
    const plan = effectivePlan(user)
    const { activeLeadsLimit } = planLimits(plan)
    if (activeLeadsLimit !== Infinity) {
      const activeCount = await prisma.lead.count({
        where: { userId, status: { in: ACTIVE_LEAD_STATUSES as unknown as string[] as any } },
      })
      if (activeCount >= activeLeadsLimit) {
        return NextResponse.json(
          {
            error: `Você atingiu o limite de ${activeLeadsLimit} leads ativos do plano grátis. Feche ou arquive leads, ou assine o Start para continuar.`,
            code: 'LEAD_LIMIT',
          },
          { status: 403 }
        )
      }
    }
  }

  const lead = await prisma.lead.create({
    data: {
      userId,
      name: data.name,
      phone: data.phone || null,
      service: data.service || null,
      value: parseValue(data.value),
      status,
      notes: data.notes || null,
      nextFollowup: data.nextFollowup ? new Date(data.nextFollowup) : null,
    },
  })

  return NextResponse.json({ lead }, { status: 201 })
}
