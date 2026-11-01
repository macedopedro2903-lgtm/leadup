import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

const schema = z.object({
  action: z.enum(['ACTIVATE_START', 'DEACTIVATE_START', 'SUSPEND', 'REACTIVATE']),
  startDate: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await getSessionUserId()
  if (!adminId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  const { action, expiresAt, note } = parsed.data

  const oldPlan = `${target.plan}/${target.planStatus}`
  let updateData: Record<string, unknown> = {}

  if (action === 'ACTIVATE_START') {
    updateData = {
      plan: 'START',
      planStatus: 'ACTIVE',
      planExpiresAt: expiresAt ? new Date(expiresAt) : null,
    }
    // Resolver solicitações pendentes
    await prisma.planRequest.updateMany({
      where: { userId: id, status: 'PENDING' },
      data: { status: 'ACTIVE' },
    })
  } else if (action === 'DEACTIVATE_START') {
    updateData = { plan: 'FREE', planStatus: 'INACTIVE', planExpiresAt: null }
  } else if (action === 'SUSPEND') {
    updateData = { planStatus: 'SUSPENDED' }
  } else if (action === 'REACTIVATE') {
    updateData = { planStatus: target.plan === 'START' ? 'ACTIVE' : 'INACTIVE' }
  }

  const updated = await prisma.user.update({ where: { id }, data: updateData })

  await prisma.planChangeLog.create({
    data: {
      adminId,
      userId: id,
      oldPlan,
      newPlan: `${updated.plan}/${updated.planStatus}`,
      note: note || action,
    },
  })

  return NextResponse.json({ ok: true })
}
