'use client';

import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';

const SEGMENTS = [
  { emoji: '🚗', name: 'Estética automotiva' },
  { emoji: '🔧', name: 'Mecânicas e oficinas' },
  { emoji: '☀️', name: 'Energia solar' },
  { emoji: '🪟', name: 'Vidraçarias' },
  { emoji: '🪚', name: 'Marcenarias' },
  { emoji: '⚡', name: 'Eletricistas' },
  { emoji: '💈', name: 'Barbearias' },
  { emoji: '💆', name: 'Clínicas de estética' },
  { emoji: '🦷', name: 'Dentistas' },
  { emoji: '🛠️', name: 'Serviços gerais' },
];

export function Industries() {
  return (
    <section id="segmentos" className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Para quem é</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Se você recebe leads e precisa fazer follow-up, é pra você.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              O LeadUp foi criado para qualquer pequeno negócio que recebe orçamentos pelo WhatsApp e não quer mais perder vendas.
            </p>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" staggerDelay={0.05}>
          {SEGMENTS.map((s: any, i: number) => (
            <StaggerItem key={i}>
              <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                <span className="text-3xl">{s.emoji}</span>
                <span className="text-sm font-medium text-foreground text-center">{s.name}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
