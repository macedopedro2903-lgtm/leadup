import { Logo } from '@/components/leadup/logo';
import { APP_CONFIG } from '@/config/app';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — LeadUp',
  description: 'Termos de uso do LeadUp.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <a href="/">
            <Logo className="h-6 w-auto" />
          </a>
        </div>
      </header>
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Termos de Uso</h1>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Aviso:</strong> Este texto é uma versão base para fins informativos. Recomendamos a revisão por um profissional jurídico antes da publicação definitiva.
          </div>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">1. Aceitação</h2>
            <p>Ao acessar e utilizar o {APP_CONFIG.BRAND_NAME}, você concorda com estes termos de uso. Se não concordar, por favor não utilize a plataforma.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">2. Descrição do serviço</h2>
            <p>O {APP_CONFIG.BRAND_NAME} é uma plataforma de gestão de leads e oportunidades comerciais voltada para pequenos negócios. O serviço inclui organização de contatos, acompanhamento de pipeline e ferramentas de follow-up.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">3. Conta do usuário</h2>
            <p>Você é responsável por manter a confidencialidade das suas credenciais de acesso. Todas as atividades realizadas na sua conta são de sua responsabilidade.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">4. Planos e pagamentos</h2>
            <p>O {APP_CONFIG.BRAND_NAME} oferece um plano gratuito com funcionalidades limitadas e planos pagos com recursos adicionais. Os preços podem ser alterados com aviso prévio de 30 dias.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">5. Cancelamento</h2>
            <p>Você pode cancelar sua conta a qualquer momento. Após o cancelamento, seus dados serão mantidos por 30 dias para eventual recuperação, e após esse período serão excluídos permanentemente.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">6. Limitação de responsabilidade</h2>
            <p>O {APP_CONFIG.BRAND_NAME} é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Nossa responsabilidade é limitada ao valor pago pelo serviço no período em questão.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">7. Contato</h2>
            <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail <span suppressHydrationWarning>{APP_CONFIG.SUPPORT_EMAIL}</span>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center">
          <a href="/" className="text-sm text-primary hover:underline">← Voltar para o início</a>
        </div>
      </main>
    </div>
  );
}
