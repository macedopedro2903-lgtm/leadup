import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export class BusinessError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 3) continue
      throw error
    }
  }
}

export function apiError(error: unknown) {
  if (error instanceof BusinessError) return Response.json({ error: error.message }, { status: error.status })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return Response.json({ error: 'Já existe um registro com esses dados.' }, { status: 409 })
  return Response.json({ error: 'Não foi possível salvar. Tente novamente.' }, { status: 500 })
}
