import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

const schema = z.object({
  leadId: z.string().min(1),
  message: z.string().trim().min(1, 'A mensagem não pode ficar vazia.'),
  tone: z.enum(['AMIGAVEL', 'PROFISSIONAL', 'DIRETO']).optional().nullable(),
  generatedByAi: z.boolean().optional(),
})

export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const { leadId, message, tone, generatedByAi } = parsed.data

  // Garantir que o lead pertence ao usuário
  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead || lead.userId !== userId) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 })
  }

  const followup = await prisma.followup.create({
    data: {
      userId,
      leadId,
      message,
      tone: tone ?? null,
      generatedByAi: generatedByAi ?? false,
    },
  })
  return NextResponse.json({ followup }, { status: 201 })
}
