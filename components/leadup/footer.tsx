import { Logo } from './logo';
import { APP_CONFIG } from '@/config/app';

export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Logo className="h-6 w-auto" />
            <p className="text-sm text-muted-foreground">{APP_CONFIG.TAGLINE}</p>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-primary transition-colors">Termos</a>
            <a href="#faq" className="hover:text-primary transition-colors">Dúvidas</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/60">
            © 2026 {APP_CONFIG.BRAND_NAME}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground/40 mt-2">
            {APP_CONFIG.BRAND_NAME} não é afiliado, associado, autorizado ou endossado pelo WhatsApp Inc. ou Meta Platforms Inc.
            WhatsApp é uma marca registrada da Meta Platforms Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
