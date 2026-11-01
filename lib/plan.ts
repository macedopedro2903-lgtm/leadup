import { APP_CONFIG } from '@/config/app'
import type { User } from '@prisma/client'

export type EffectivePlan = 'FREE' | 'START'

/** Status de lead considerados "ativos" (ocupam o limite do plano Free). */
export const ACTIVE_LEAD_STATUSES = ['NOVO', 'ORCAMENTO_ENVIADO', 'NEGOCIANDO'] as const

/**
 * Plano efetivo do usuário levando em conta expiração e status.
 * START só vale se estiver ACTIVE e não expirado.
 */
export function effectivePlan(user: Pick<User, 'plan' | 'planStatus' | 'planExpiresAt'>): EffectivePlan {
  if (user.plan === 'START' && user.planStatus === 'ACTIVE') {
    if (!user.planExpiresAt || user.planExpiresAt.getTime() > Date.now()) {
      return 'START'
    }
  }
  return 'FREE'
}

export function planLimits(plan: EffectivePlan) {
  if (plan === 'START') {
    return {
      activeLeadsLimit: Infinity,
      aiGenerations: APP_CONFIG.START_AI_GENERATIONS,
    }
  }
  return {
    activeLeadsLimit: APP_CONFIG.FREE_ACTIVE_LEADS_LIMIT,
    aiGenerations: APP_CONFIG.FREE_AI_GENERATIONS,
  }
}

/** Início do período atual de contagem de IA (mês corrente). */
export function currentPeriodStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}
