# LeadUp

LeadUp e um micro-SaaS brasileiro que ajuda pequenos negocios a organizarem
oportunidades, orcamentos e follow-ups recebidos principalmente pelo WhatsApp,
para nao esquecer negociacoes e fechar mais clientes.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth
- API de IA (RouteLLM)

## Estrutura

- app/ - rotas, paginas e endpoints de API
- components/ - componentes de UI
- config/app.ts - configuracao central
- lib/ - utilitarios
- prisma/schema.prisma - schema do banco
- scripts/ - seed e scripts auxiliares

## Setup

1. yarn install
2. cp .env.example .env (preencha os valores)
3. yarn prisma generate && yarn prisma db push
4. (Opcional) yarn tsx scripts/seed.ts

Veja .env.example para variaveis necessarias.
