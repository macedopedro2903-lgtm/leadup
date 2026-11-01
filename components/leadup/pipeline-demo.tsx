'use client';

import { FadeIn } from '@/components/ui/animate';
import { Phone, Mail, Clock } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Novos', color: 'bg-blue-500', count: 3,
    cards: [
      { name: 'Pedro Lima', service: 'Orçamento pintura', value: 'R$ 800', time: 'Hoje' },
      { name: 'Camila Reis', service: 'Polimento', value: 'R$ 350', time: '1h atrás' },
    ],
  },
  {
    title: 'Orçamento Enviado', color: 'bg-purple-500', count: 2,
    cards: [
      { name: 'Roberto Alves', service: 'Vitrificação + PPF', value: 'R$ 2.400', time: '2 dias', alert: true },
      { name: 'Flávia Nunes', service: 'Higienização', value: 'R$ 180', time: '1 dia' },
    ],
  },
  {
    title: 'Negociando', color: 'bg-amber-500', count: 2,
    cards: [
      { name: 'Marcos Souza', service: 'Repintura parcial', value: 'R$ 1.500', time: '3 dias' },
    ],
  },
  {
    title: 'Fechados', color: 'bg-emerald-500', count: 4,
    cards: [
      { name: 'Ana Costa', service: 'Polimento cristalizado', value: 'R$ 1.300', time: 'Ontem' },
      { name: 'Lucas Ferreira', service: 'Envelopamento', value: 'R$ 3.200', time: '3 dias' },
    ],
  },
];

export function PipelineDemo() {
  return (
    <section id="recursos" className="py-16 sm:py-24 bg-muted/40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Pipeline visual</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Veja todas as suas oportunidades de uma vez
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Arraste os cards entre as colunas conforme cada negócio avança. Simples como um quadro de post-its, poderoso o suficiente para não perder nenhuma oportunidade.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 min-w-[800px]">
              {COLUMNS.map((col: any) => (
                <div key={col.title} className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="text-sm font-semibold text-foreground">{col.title}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{col.count}</span>
                  </div>
                  <div className="space-y-2">
                    {(col.cards ?? []).map((card: any) => (
                      <div
                        key={card.name}
                        className={`p-3 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab ${
                          card.alert ? 'border-amber-300 ring-1 ring-amber-200' : 'border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{card.name}</span>
                          {card.alert && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">⚠️</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{card.service}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold font-mono text-foreground">{card.value}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={10} />
                            {card.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-4">
            <span className="inline-block px-3 py-1.5 bg-foreground/5 text-xs text-muted-foreground rounded-full">
              Dados de demonstração
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
