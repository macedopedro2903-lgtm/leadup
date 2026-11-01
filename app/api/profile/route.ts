import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().trim().min(1).optional(),
  businessName: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).refine(v=>Buffer.byteLength(v)<=72).optional(),
})

export async function PATCH(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const data = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.businessName !== undefined) updateData.businessName = data.businessName || null
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null

  // Troca de senha
  if (data.newPassword) {
    if (!user.hashedPassword) {
      return NextResponse.json({ error: 'Não foi possível alterar a senha.' }, { status: 400 })
    }
    const ok = data.currentPassword ? await bcrypt.compare(data.currentPassword, user.hashedPassword) : false
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 })
    }
    updateData.hashedPassword = await bcrypt.hash(data.newPassword, 12)
    updateData.sessionVersion = {increment:1}
  }

  const changed=await prisma.user.updateMany({ where: { id: userId, ...(data.newPassword?{hashedPassword:user.hashedPassword}:{}) }, data: updateData })
  if(changed.count!==1)return NextResponse.json({error:'A conta foi alterada. Entre novamente e tente outra vez.'},{status:409})
  return NextResponse.json({ ok: true })
}
