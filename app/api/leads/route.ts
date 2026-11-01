import { NextResponse } from 'next/server'
import { leadSchema } from '@/lib/lead-validation'
import { saveLead } from '@/lib/lead-write'
import { apiError } from '@/lib/transactions'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

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
  if (!userId) return NextResponse.json({error:'Não autorizado.'},{status:401})
  const parsed = leadSchema.safeParse(await req.json().catch(()=>null))
  if (!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400})
  try { return NextResponse.json({lead:await saveLead(userId,parsed.data)},{status:201}) }
  catch(error) { return apiError(error) }
}
