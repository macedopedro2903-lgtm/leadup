'use client';

import { FadeIn } from '@/components/ui/animate';

export function ImpactPhrase() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <blockquote className="max-w-3xl mx-auto text-center">
            <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug">
              Seu próximo cliente talvez já tenha falado com você.{' '}
              <span className="text-primary">Só falta continuar a conversa.</span>
            </p>
          </blockquote>
        </FadeIn>
      </div>
    </section>
  );
}
