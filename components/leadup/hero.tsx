'use client';

import { APP_CONFIG } from '@/config/app';
import { trackEvent } from '@/lib/analytics';
import { Sparkles, ArrowRight } from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';

export function Hero() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-8">
              <Sparkles size={16} />
              <span>Follow-up inteligente para pequenas empresas</span>
            </div>
          </FadeIn>

          <SlideIn from="bottom" delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Pare de esquecer oportunidades.{' '}
              <span className="text-primary">Comece a fechar mais clientes.</span>
            </h1>
          </SlideIn>

          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Um jeito simples de organizar leads e não esquecer nenhum follow-up.
              Organize seus leads, acompanhe cada oportunidade e saiba exatamente qual negociação continuar.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={APP_CONFIG.SIGNUP_URL}
                onClick={() => trackEvent('hero_cta_clicked')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary/90 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Testar grátis
                <ArrowRight size={18} />
              </a>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-foreground/80 bg-white border border-border hover:border-primary/30 hover:text-primary rounded-2xl transition-all shadow-sm hover:shadow-md"
              >
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Simples. Rápido. Feito para quem vende por conversa e orçamento.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
