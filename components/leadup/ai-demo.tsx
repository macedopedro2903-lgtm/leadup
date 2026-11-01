'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/ui/animate';
import { Sparkles, Bot, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const DEMO_INPUT = {
  name: 'João Batista',
  service: 'Vitrificação automotiva',
  value: 'R$ 600',
  lastContact: '3 dias atrás',
};

const DEMO_OUTPUT = `Oi João, tudo bem? Aqui é da [Sua Empresa]. \n\nPassando só pra saber se conseguiu avaliar o orçamento da vitrificação que enviei. Fico à disposição caso tenha alguma dúvida sobre o processo ou queira agendar. \n\nForte abraço! 🙏`;

export function AIDemo() {
  const [generated, setGenerated] = useState(false);
  const [typing, setTyping] = useState(false);

  const handleGenerate = () => {
    if (generated) return;
    setTyping(true);
    trackEvent('hero_cta_clicked');
    setTimeout(() => {
      setTyping(false);
      setGenerated(true);
    }, 1500);
  };

  return (
    <section className="py-16 sm:py-24 bg-foreground text-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-medium mb-4">
              <Bot size={14} />
              Demonstração do funcionamento planejado
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Follow-up inteligente com IA
            </h2>
            <p className="text-background/60 max-w-xl mx-auto">
              A IA analisa o contexto do lead e sugere a mensagem ideal para retomar o contato. Você revisa, edita e envia.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/[0.06] rounded-2xl border border-white/[0.1] overflow-hidden">
              {/* Context header */}
              <div className="p-5 border-b border-white/[0.08]">
                <p className="text-sm font-semibold text-background mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-emerald-400" />
                  Contexto do lead
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DEMO_INPUT).map(([key, val]: [string, string]) => {
                    const labels: Record<string, string> = {
                      name: 'Nome', service: 'Serviço', value: 'Valor', lastContact: 'Último contato',
                    };
                    return (
                      <div key={key} className="bg-white/[0.05] rounded-lg p-3">
                        <p className="text-xs text-background/40 mb-1">{labels[key] ?? key}</p>
                        <p className="text-sm font-medium text-background">{val}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generate button / result */}
              <div className="p-5">
                {!generated && !typing && (
                  <button
                    onClick={handleGenerate}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    <Sparkles size={18} />
                    Gerar mensagem de follow-up
                  </button>
                )}

                {typing && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-background/50">Gerando mensagem...</span>
                  </div>
                )}

                {generated && (
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      Mensagem sugerida
                    </p>
                    <div className="bg-white/[0.05] rounded-xl p-4 text-sm text-background/90 leading-relaxed whitespace-pre-line">
                      {DEMO_OUTPUT}
                    </div>
                    <p className="text-xs text-background/30 mt-3 text-center">
                      Você sempre revisa e edita antes de enviar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-4">
              <span className="inline-block px-3 py-1.5 bg-white/[0.06] text-xs text-background/40 rounded-full">
                Recurso em desenvolvimento — demonstração ilustrativa
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
