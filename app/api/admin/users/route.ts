import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const admin = await prisma.user.findUnique({ where: { id: userId } })
  if (!admin?.isAdmin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, businessName: true, whatsapp: true,
      plan: true, planStatus: true, planExpiresAt: true, isAdmin: true, createdAt: true,
      _count: { select: { leads: true } },
    },
  })
  return NextResponse.json({ users })
}
