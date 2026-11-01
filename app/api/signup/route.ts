import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  businessName: z.string().trim().optional().or(z.literal('')),
  whatsapp: z.string().trim().optional().or(z.literal('')),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Dados inválidos.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { name, email, password, businessName, whatsapp } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este e-mail.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        businessName: businessName || null,
        whatsapp: whatsapp || null,
        plan: 'FREE',
        planStatus: 'INACTIVE',
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[signup] error', err)
    return NextResponse.json(
      { error: 'Não foi possível criar a conta agora. Tente novamente.' },
      { status: 500 }
    )
  }
}
