export const APP_CONFIG = {
  APP_NAME: 'LeadUp',
  BRAND_NAME: 'LeadUp',
  TAGLINE: 'Organize. Acompanhe. Feche.',
  DESCRIPTION: 'Organize leads, acompanhe orçamentos e saiba quem precisa de follow-up. Feito para pequenos negócios que vendem pelo WhatsApp.',
  SUPPORT_EMAIL: 'contato@leadup.com.br',
  WHATSAPP_SALES_URL: '#',
  // Número comercial para receber solicitações de assinatura (somente dígitos, ex: 5511999999999).
  // Vazio => aparece como "pendente de configuração" no admin, sem quebrar o app.
  WHATSAPP_SALES_NUMBER: '5517988203753',
  LOGIN_URL: '/login',
  SIGNUP_URL: '/cadastro',
  // Limites e planos
  MAX_IMPORT_ROWS: 1000,
  MAX_IMPORT_FILE_BYTES: 2 * 1024 * 1024,
  FREE_PLAN_LIMIT: 10,
  FREE_ACTIVE_LEADS_LIMIT: 10,
  FREE_AI_GENERATIONS: 5,
  START_AI_GENERATIONS: 100,
  START_PRICE: 29.90,
  LAUNCH_PRICE: 9.90,
  TRIAL_ENABLED: true,
  EARLY_ACCESS_ENABLED: true,
  SITE_URL: 'https://leadup.com.br',
} as const;

export type AppConfig = typeof APP_CONFIG;
