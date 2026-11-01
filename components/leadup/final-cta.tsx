'use client';

import { FadeIn } from '@/components/ui/animate';
import { APP_CONFIG } from '@/config/app';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 bg-foreground text-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-medium mb-6">
              <Sparkles size={14} />
              Comece agora, sem cartão de crédito
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-6">
              Você já trabalha duro.
              <br />
              <span className="text-emerald-400">Agora feche o que merece.</span>
            </h2>
            <p className="text-background/60 text-lg mb-10 max-w-lg mx-auto">
              Organize seus leads, faça follow-up na hora certa e transforme oportunidades em clientes.
            </p>
            <a
              href={APP_CONFIG.SIGNUP_URL}
              className="inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              QUERO TESTAR GRÁTIS
              <ArrowRight size={20} />
            </a>
            <p className="mt-4 text-sm text-background/40">
              Grátis para até {APP_CONFIG.FREE_PLAN_LIMIT} leads · Pronto em 2 minutos
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
