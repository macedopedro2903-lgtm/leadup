import { Logo } from '@/components/leadup/logo';
import { APP_CONFIG } from '@/config/app';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — LeadUp',
  description: 'Política de privacidade do LeadUp.',
};

export default function PrivacidadePage() {
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
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Política de Privacidade</h1>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Aviso:</strong> Este texto é uma versão base para fins informativos. Recomendamos a revisão por um profissional jurídico antes da publicação definitiva.
          </div>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">1. Informações coletadas</h2>
            <p>O {APP_CONFIG.BRAND_NAME} coleta as seguintes informações quando você utiliza nossa plataforma:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nome e informações de contato (e-mail, telefone)</li>
              <li>Dados da empresa (nome, segmento de atuação)</li>
              <li>Dados de uso da plataforma (leads cadastrados, interações)</li>
              <li>Informações técnicas (IP, navegador, dispositivo)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">2. Uso das informações</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Fornecer e manter o serviço</li>
              <li>Enviar comunicações relevantes sobre o produto</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">3. Compartilhamento</h2>
            <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para a prestação do serviço (provedores de infraestrutura, processadores de pagamento) ou por exigência legal.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">4. Seus direitos</h2>
            <p>Em conformidade com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">5. Contato</h2>
            <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato pelo e-mail <span suppressHydrationWarning>{APP_CONFIG.SUPPORT_EMAIL}</span>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center">
          <a href="/" className="text-sm text-primary hover:underline">← Voltar para o início</a>
        </div>
      </main>
    </div>
  );
}
