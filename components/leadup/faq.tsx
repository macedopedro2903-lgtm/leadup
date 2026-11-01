'use client';

import { FadeIn } from '@/components/ui/animate';
import { trackEvent } from '@/lib/analytics';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'O LeadUp é gratuito?',
    a: 'Sim! O plano Grátis permite até 30 leads ativos, sem prazo de validade. Quando precisar de mais, você faz upgrade.',
  },
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O LeadUp funciona 100% no navegador, tanto no computador quanto no celular. Basta acessar e começar.',
  },
  {
    q: 'Ele substitui meu WhatsApp?',
    a: 'Não. O LeadUp é um complemento. Você continua atendendo no WhatsApp normalmente e usa o LeadUp para organizar, acompanhar e lembrar de fazer follow-up.',
  },
  {
    q: 'Funciona para qualquer tipo de negócio?',
    a: 'Sim, qualquer negócio que recebe leads e precisa acompanhar oportunidades. Criamos pensando em prestadores de serviço, mas funciona para qualquer segmento.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Seus dados são criptografados e armazenados com segurança. Apenas você e sua equipe têm acesso.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa e sem fidelidade. Cancele quando quiser direto na plataforma.',
  },
  {
    q: 'O que é o follow-up com IA?',
    a: 'Um recurso planejado que vai sugerir mensagens personalizadas para você retomar contato com leads parados. Você sempre revisa e edita antes de enviar.',
  },
  {
    q: 'Como funciona o acesso antecipado?',
    a: 'Cadastre-se na lista e você será um dos primeiros a usar o LeadUp com preço especial de lançamento quando abrirmos as vagas.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">Dúvidas</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Perguntas frequentes
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq: any, i: number) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-white rounded-xl border border-border/50 shadow-sm px-5 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger
                    onClick={() => trackEvent('faq_opened')}
                    className="text-left text-sm font-semibold text-foreground hover:no-underline py-4"
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
