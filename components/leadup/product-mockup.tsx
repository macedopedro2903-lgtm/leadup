'use client';

import { useState, useEffect } from 'react';
import { FadeIn } from '@/components/ui/animate';
import { Sparkles, Phone, Clock, TrendingUp } from 'lucide-react';

const DEMO_LEADS = [
  { name: 'Carlos Menezes', service: 'Pintura completa', value: 900, status: 'Novo', statusColor: 'bg-blue-500', time: '2 min atrás' },
  { name: 'João Batista', service: 'Vitrificação', value: 450, status: 'Follow-up', statusColor: 'bg-amber-500', time: '3 dias', highlight: true },
  { name: 'Marcos Oliveira', service: 'Polimento + Cera', value: 1200, status: 'Orçamento', statusColor: 'bg-purple-500', time: '1 dia' },
  { name: 'Ana Costa', service: 'Higienização interna', value: 1300, status: 'Fechado', statusColor: 'bg-emerald-500', time: 'Hoje' },
];

export function ProductMockup() {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [followUpShown, setFollowUpShown] = useState(false);
  const targetValue = 3850;

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * targetValue));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="relative max-w-4xl mx-auto">
            {/* Browser chrome mockup */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/60 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white/80 rounded-md text-xs text-muted-foreground border border-border/50">
                    app.leadup.com.br
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
                    <p className="text-xl font-display font-bold text-foreground">Boa tarde, Lucas 👋</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 rounded-xl">
                      <TrendingUp size={16} className="text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        R$ {animatedValue.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-muted-foreground">pipeline</span>
                    </div>
                  </div>
                </div>

                {/* Lead list */}
                <div className="space-y-2">
                  {DEMO_LEADS.map((lead: any, i: number) => (
                    <div
                      key={lead.name}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all ${
                        lead.highlight
                          ? 'bg-amber-50 border border-amber-200/60 ring-1 ring-amber-200/40'
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span className="hidden sm:inline text-xs text-muted-foreground">
                          <Clock size={12} className="inline mr-1" />
                          {lead.time}
                        </span>
                        <span className="text-sm font-semibold text-foreground font-mono">
                          R$ {lead.value.toLocaleString('pt-BR')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${lead.statusColor}`}>
                          {lead.status}
                        </span>
                        {lead.highlight && !followUpShown && (
                          <button
                            onClick={() => setFollowUpShown(true)}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Sparkles size={12} />
                            Gerar follow-up
                          </button>
                        )}
                        {lead.highlight && followUpShown && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg">
                            <Sparkles size={12} />
                            Mensagem sugerida ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating label */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground text-background text-xs font-medium rounded-full shadow-lg">
              Dados de demonstração
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
