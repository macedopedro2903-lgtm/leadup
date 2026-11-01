import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Evitar duplicar solicitações pendentes
  const existing = await prisma.planRequest.findFirst({
    where: { userId, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json({ request: existing, alreadyPending: true })
  }

  const request = await prisma.planRequest.create({
    data: { userId, plan: 'START', status: 'PENDING' },
  })
  return NextResponse.json({ request }, { status: 201 })
}
