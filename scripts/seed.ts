import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertAdmin(email: string, password: string, name: string) {
  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, plan: 'START', planStatus: 'ACTIVE' },
    create: {
      email,
      name,
      hashedPassword,
      isAdmin: true,
      plan: 'START',
      planStatus: 'ACTIVE',
      businessName: 'LeadUp',
    },
  })
}

async function main() {
  // Conta de teste/administração interna (não exibir ao usuário).
  await upsertAdmin(process.env.SEED_INTERNAL_ADMIN_EMAIL || 'admin-interno@example.com', process.env.SEED_INTERNAL_ADMIN_PASSWORD || 'change-me', 'Admin Interno')

  // Conta administrativa do proprietário do LeadUp.
  await upsertAdmin(process.env.SEED_ADMIN_EMAIL || 'admin@leadup.com.br', process.env.SEED_ADMIN_PASSWORD || 'change-me', 'Administrador LeadUp')

  console.log('Seed concluído.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
