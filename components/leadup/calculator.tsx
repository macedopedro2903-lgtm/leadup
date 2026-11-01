'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/ui/animate';
import { Calculator as CalcIcon, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { APP_CONFIG } from '@/config/app';

export function Calculator() {
  const [budgets, setBudgets] = useState(20);
  const [ticket, setTicket] = useState(500);
  const [calculated, setCalculated] = useState(false);

  const totalMovimentado = budgets * ticket;

  const handleCalculate = () => {
    setCalculated(true);
    trackEvent('calculator_used');
  };

  return (
    <section className="py-16 sm:py-24 bg-muted/40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Calculadora</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Quanto dinheiro passa pelos seus orçamentos todos os meses?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Descubra o valor total que você movimenta em propostas.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-border/50 shadow-sm p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-foreground mb-2">
                  <span>Orçamentos enviados por mês</span>
                  <span className="font-mono text-primary font-bold">{budgets}</span>
                </label>
                <input
                  type="range" min={5} max={100} value={budgets}
                  onChange={(e: any) => { setBudgets(Number(e.target.value)); setCalculated(false); }}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5</span><span>100</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-foreground mb-2">
                  <span>Ticket médio (R$)</span>
                  <span className="font-mono text-primary font-bold">R$ {ticket.toLocaleString('pt-BR')}</span>
                </label>
                <input
                  type="range" min={50} max={5000} step={50} value={ticket}
                  onChange={(e: any) => { setTicket(Number(e.target.value)); setCalculated(false); }}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>R$ 50</span><span>R$ 5.000</span>
                </div>
              </div>

              {!calculated ? (
                <button
                  onClick={handleCalculate}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <CalcIcon size={18} />
                  Calcular
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-5 bg-primary/5 rounded-xl border border-primary/15">
                    <p className="text-sm text-muted-foreground mb-1">Você movimenta aproximadamente</p>
                    <p className="text-3xl font-bold text-foreground font-mono">
                      R$ {totalMovimentado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">em propostas por mês</p>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Organizar essas oportunidades pode fazer diferença no seu fechamento.
                  </p>
                  <a
                    href="#acesso-antecipado"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Organizar meus leads
                    <ArrowRight size={18} />
                  </a>
                </div>
              )}
            </div>


          </div>
        </FadeIn>
      </div>
    </section>
  );
}
