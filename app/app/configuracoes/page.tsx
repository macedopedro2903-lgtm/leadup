import { requireUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { effectivePlan, planLimits, currentPeriodStart } from '@/lib/plan'
import { APP_CONFIG } from '@/config/app'
import { ConfiguracoesClient } from '@/components/app/configuracoes-client'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const user = await requireUser()
  const plan = effectivePlan(user)
  const { aiGenerations } = planLimits(plan)
  const aiUsed = await prisma.aiUsage.count({ where: { userId: user.id, type: 'followup', createdAt: { gte: currentPeriodStart() } } })

  const planExpiresAt = user.planExpiresAt
    ? user.planExpiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    : null

  return (
    <ConfiguracoesClient
      user={{ name: user.name ?? '', email: user.email, businessName: user.businessName ?? '', whatsapp: user.whatsapp ?? '' }}
      planLabel={plan === 'START' ? 'Start' : 'Grátis'}
      planExpiresAt={plan === 'START' ? planExpiresAt : null}
      aiUsed={aiUsed}
      aiLimit={aiGenerations}
      isStart={plan === 'START'}
      startPrice={APP_CONFIG.START_PRICE.toFixed(2).replace('.', ',')}
      launchPrice={APP_CONFIG.LAUNCH_PRICE.toFixed(2).replace('.', ',')}
      whatsappSalesNumber={APP_CONFIG.WHATSAPP_SALES_NUMBER}
    />
  )
}
