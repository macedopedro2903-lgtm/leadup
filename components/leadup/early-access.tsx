'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/ui/animate';
import { CheckCircle2, Send, Rocket } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const SEGMENTS_OPTIONS = [
  'Estética automotiva', 'Mecânica / Oficina', 'Energia solar', 'Vidraçaria',
  'Marcenaria', 'Eletricista', 'Barbearia', 'Clínica de estética', 'Odontologia', 'Outro',
];

export function EarlyAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('early_access_completed');
    setSubmitted(true);
  };

  const handleFocus = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('early_access_started');
    }
  };

  if (submitted) {
    return (
      <section id="acesso-antecipado" className="py-16 sm:py-24 bg-primary/[0.04]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Você está na lista! 🎉
            </h2>
            <p className="text-muted-foreground">
              Entraremos em contato assim que as primeiras vagas estiverem disponíveis. Fique de olho no seu WhatsApp!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="acesso-antecipado" className="py-16 sm:py-24 bg-primary/[0.04]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Rocket size={14} />
                Acesso antecipado
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                Estamos abrindo as primeiras vagas
              </h2>
              <p className="text-muted-foreground">
                Garanta seu lugar e seja um dos primeiros a usar o LeadUp com condições especiais de lançamento.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="ea-name" className="block text-sm font-medium text-foreground mb-1.5">Nome *</label>
                <input
                  id="ea-name" type="text" required onFocus={handleFocus}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="ea-company" className="block text-sm font-medium text-foreground mb-1.5">Nome da empresa *</label>
                <input
                  id="ea-company" type="text" required onFocus={handleFocus}
                  placeholder="Ex: Auto Estética Premium"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="ea-whatsapp" className="block text-sm font-medium text-foreground mb-1.5">WhatsApp *</label>
                <input
                  id="ea-whatsapp" type="tel" required onFocus={handleFocus}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="ea-segment" className="block text-sm font-medium text-foreground mb-1.5">Segmento *</label>
                <select
                  id="ea-segment" required onFocus={handleFocus}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione seu segmento</option>
                  {SEGMENTS_OPTIONS.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ea-email" className="block text-sm font-medium text-foreground mb-1.5">E-mail <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <input
                  id="ea-email" type="email" onFocus={handleFocus}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-base"
              >
                <Send size={18} />
                Quero garantir minha vaga
              </button>
              <p className="text-xs text-center text-muted-foreground">
                Suas informações serão usadas apenas para contato sobre o LeadUp.
              </p>
            </form>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
