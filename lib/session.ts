import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import type { User } from '@prisma/client'

/** Garante sessão válida em server components. Redireciona para /login se não autenticado. */
export async function requireUser(): Promise<User> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    redirect('/login')
  }
  return user
}

/** Garante que o usuário é admin. Redireciona para /app se não for. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (!user.isAdmin) {
    redirect('/app')
  }
  return user
}

/** Para rotas de API: retorna o id do usuário autenticado ou null. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
