'use client';

import { useState, useEffect, useRef } from 'react';
import { FadeIn } from '@/components/ui/animate';
import { DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

function AnimatedCounter({ target, prefix = 'R$ ', duration = 1800 }: { target: number; prefix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {prefix}{value.toLocaleString('pt-BR')}
    </span>
  );
}

const SUB_CARDS = [
  { label: 'Orçamentos sem resposta', value: 2400, color: 'text-red-500', icon: AlertTriangle },
  { label: 'Esperando follow-up', value: 3530, color: 'text-amber-500', icon: TrendingUp },
  { label: 'Negociação parada', value: 1500, color: 'text-orange-500', icon: DollarSign },
];

export function MoneyDashboard() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Dinheiro parado</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Veja quanto dinheiro está parado no seu pipeline
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada lead sem follow-up é dinheiro que pode estar escapando. Visualize o valor total em aberto.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="max-w-3xl mx-auto">
            {/* Main value */}
            <div className="text-center p-8 bg-white rounded-2xl border border-border/50 shadow-sm mb-6">
              <p className="text-sm text-muted-foreground mb-2">Valor total em oportunidades abertas</p>
              <p className="text-4xl sm:text-5xl font-bold text-foreground">
                <AnimatedCounter target={7430} />
              </p>
              <p className="text-sm text-muted-foreground mt-2">em oportunidades que precisam de atenção</p>
            </div>

            {/* Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SUB_CARDS.map((card: any) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="p-5 bg-white rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} className={card.color} />
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${card.color}`}>
                      <AnimatedCounter target={card.value} />
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4">
              <span className="inline-block px-3 py-1.5 bg-foreground/5 text-xs text-muted-foreground rounded-full">
                Dados de demonstração — valores ilustrativos
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
