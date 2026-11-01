'use client';

import { FadeIn } from '@/components/ui/animate';
import { X, Check } from 'lucide-react';

const ROWS = [
  { before: 'Leads anotados em papel ou bloco de notas', after: 'Todos os leads organizados em um painel' },
  { before: 'Esquece de fazer follow-up', after: 'Follow-ups claros e organizados' },
  { before: 'Não sabe quanto tem em aberto', after: 'Dashboard com valor total do pipeline' },
  { before: 'Não sabe quanto tem em negociação', after: 'Valor em negociação visível no dashboard' },
  { before: 'Sem histórico das conversas e orçamentos', after: 'Tudo registrado, fácil de consultar' },
];

export function Comparison() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Antes e depois do LeadUp
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center px-4 py-3 bg-red-50 rounded-xl">
                <span className="text-sm font-bold text-red-600">Antes</span>
              </div>
              <div className="text-center px-4 py-3 bg-emerald-50 rounded-xl">
                <span className="text-sm font-bold text-emerald-600">Depois</span>
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {ROWS.map((row: any, i: number) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-border/50 shadow-sm">
                    <X size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/70">{row.before}</span>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-primary/20 shadow-sm">
                    <Check size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">{row.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
