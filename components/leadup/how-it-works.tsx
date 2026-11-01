'use client';

import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { UserPlus, ClipboardList, Bell, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Cadastre o lead', desc: 'Registre o contato que chegou pelo WhatsApp, ligação ou indicação.' },
  { icon: ClipboardList, title: 'Registre a oportunidade', desc: 'Anote o serviço, valor e em que etapa está.' },
  { icon: Bell, title: 'Acompanhe', desc: 'Receba lembretes e saiba a hora certa de fazer follow-up.' },
  { icon: CheckCircle2, title: 'Feche', desc: 'Mova o card para "Fechado" e veja seu faturamento crescer.' },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Como funciona</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              4 passos para nunca mais perder uma venda
            </h2>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {STEPS.map((step: any, i: number) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={i}>
                <div className="relative p-6 rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="absolute -top-3 -left-1 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 text-border text-xl">→</div>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
