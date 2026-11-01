import { NextResponse } from 'next/server'
import { leadSchema } from '@/lib/lead-validation'
import { saveLead } from '@/lib/lead-write'
import { apiError } from '@/lib/transactions'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

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
  const followups = await prisma.followup.findMany({ where: { leadId: id, userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ lead, followups })
}

export async function PATCH(req: Request, {params}: {params: Promise<{id:string}>}) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  const {id} = await params
  const parsed = leadSchema.partial().safeParse(await req.json().catch(()=>null))
  if (!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400})
  try { return NextResponse.json({lead:await saveLead(userId,parsed.data,id)}) }
  catch(error) { return apiError(error) }
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
