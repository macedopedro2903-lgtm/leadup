'use client';

import { FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate';
import { Zap, Clock, BarChart3, Smartphone, Shield, Heart } from 'lucide-react';

const BENEFITS = [
  { icon: Zap, title: 'Simples de usar', desc: 'Interface limpa, sem complicação. Funciona no celular e no computador.' },
  { icon: Clock, title: 'Economize tempo', desc: 'Pare de procurar informações em anotações. Tudo está em um lugar só.' },
  { icon: BarChart3, title: 'Visão clara do negócio', desc: 'Saiba exatamente quantos leads tem, quanto vale seu pipeline e o que priorizar.' },
  { icon: Smartphone, title: 'Feito para WhatsApp', desc: 'Criado para quem recebe a maioria dos leads por mensagem.' },
  { icon: Shield, title: 'Seus dados organizados', desc: 'Informações centralizadas e acessíveis quando você precisar.' },
  { icon: Heart, title: 'Suporte humano', desc: 'Atendimento real, por gente de verdade, que entende pequenos negócios.' },
];

export function Benefits() {
  return (
    <section className="py-16 sm:py-24 bg-muted/40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Benefícios</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Por que escolher o LeadUp?
            </h2>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {BENEFITS.map((b: any, i: number) => {
            const Icon = b.icon;
            return (
              <StaggerItem key={i}>
                <HoverLift>
                  <div className="h-full p-6 bg-white rounded-2xl border border-border/50 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </HoverLift>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
