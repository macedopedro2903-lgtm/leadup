'use client';

import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';

const PROBLEMS = [
  { emoji: '💬', title: 'O lead mandou mensagem', desc: 'Chegou pelo WhatsApp, Instagram ou indicação.' },
  { emoji: '📄', title: 'Você enviou o orçamento', desc: 'Respondeu rápido, fez um preço justo.' },
  { emoji: '⏳', title: 'Passou um dia, dois, três...', desc: 'A rotina tomou conta e você esqueceu.' },
  { emoji: '😶', title: 'Ninguém fez follow-up', desc: 'Sem lembrete, sem sistema, sem controle.' },
  { emoji: '💸', title: 'O cliente fechou com outro', desc: 'Não porque o preço era melhor. Porque o outro respondeu.' },
];

export function ProblemSection() {
  return (
    <section className="py-16 sm:py-24 bg-foreground text-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Você pode estar perdendo vendas que já estavam quase fechadas.
            </h2>
            <p className="text-background/60 text-lg">
              Esse cenário se repete todos os dias em milhares de pequenos negócios:
            </p>
          </div>
        </FadeIn>

        <Stagger className="max-w-2xl mx-auto space-y-4" staggerDelay={0.1}>
          {PROBLEMS.map((p: any, i: number) => (
            <StaggerItem key={i}>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors">
                <span className="text-2xl flex-shrink-0 mt-0.5">{p.emoji}</span>
                <div>
                  <p className="font-semibold text-background mb-1">{p.title}</p>
                  <p className="text-sm text-background/55">{p.desc}</p>
                </div>
                {i < PROBLEMS.length - 1 && (
                  <div className="hidden sm:block ml-auto text-background/20 text-xl">↓</div>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
