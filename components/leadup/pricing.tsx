'use client';

import { FadeIn } from '@/components/ui/animate';
import { APP_CONFIG } from '@/config/app';
import { trackEvent } from '@/lib/analytics';
import { Check, Rocket, Crown } from 'lucide-react';

const PLANS = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '',
    desc: 'Para experimentar.',
    icon: Rocket,
    features: [
      `Até ${APP_CONFIG.FREE_PLAN_LIMIT} leads ativos`,
      'Pipeline visual',
      'Histórico',
      'Dashboard básico',
      '1 usuário',
    ],
    cta: 'Começar grátis',
    href: APP_CONFIG.SIGNUP_URL,
    highlighted: false,
  },
  {
    name: 'Start',
    price: `R$ ${APP_CONFIG.LAUNCH_PRICE.toFixed(2).replace('.', ',')}`,
    originalPrice: `R$ ${APP_CONFIG.START_PRICE.toFixed(2).replace('.', ',')}`,
    period: '/mês',
    desc: 'Para quem quer crescer sem perder leads.',
    icon: Crown,
    badge: 'ACESSO ANTECIPADO',
    features: [
      'Mais oportunidades',
      'Funil completo',
      'Follow-ups inteligentes (em breve)',
      'Histórico',
      'Dashboard financeiro',
      'Prioridade em novos recursos',
    ],
    cta: 'Quero acesso antecipado',
    href: APP_CONFIG.SIGNUP_URL,
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="precos" className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Preços</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Simples. Sem surpresas.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e faça upgrade quando quiser. Sem multa, sem fidelidade.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan: any) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col p-6 sm:p-8 rounded-2xl border transition-all ${
                    plan.highlighted
                      ? 'bg-white border-primary/30 shadow-lg ring-1 ring-primary/10'
                      : 'bg-white border-border/50 shadow-sm'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={20} className="text-primary" />
                      <span className="font-display font-bold text-lg text-foreground">{plan.name}</span>
                    </div>
                    {!plan.originalPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                        {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg text-muted-foreground line-through">{plan.originalPrice}/mês</span>
                        </div>
                        <div className="mt-2 px-3 py-1 bg-primary/10 rounded-lg inline-block">
                          <span className="text-xs font-semibold text-primary uppercase">Oferta de lançamento</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Primeiro mês por:</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-4xl sm:text-5xl font-bold text-primary">{plan.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Depois {plan.originalPrice}/mês</p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {(plan.features ?? []).map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.href}
                    onClick={() => trackEvent('pricing_cta_clicked')}
                    className={`block text-center px-6 py-3.5 font-semibold rounded-xl transition-all text-sm ${
                      plan.highlighted
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 max-w-md mx-auto">
            Estamos abrindo as primeiras vagas. Preços podem mudar após o período de lançamento.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
