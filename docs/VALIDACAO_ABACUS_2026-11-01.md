# LeadUp — validação e publicação na Abacus

Situação: preparado para revisão, NÃO publicado. Data: 01/11/2026.

## Origem preservada

- Repositório: `macedopedro2903-lgtm/leadup`.
- Branch: `atualizacao-importacao-2026-11-01`; base `36bd960eb22a3e0e6a188946eac17500868d1dc3`.
- Abacus: projeto `16bb691509`, conversa `30a119ee7`. O acesso exibiu a tela de login; domínio e versão de produção não foram confirmados.
- Pacote anexado de importação comparado com a versão 2 de `LeadUp_integracao_oficial_WhatsApp_Meta_para_validacao.zip`.
- Landing, preços, login, cadastro, funil, cobrança e seeds não foram substituídos. Não houve merge, mudança de domínio ou acesso ao banco de produção.

## Alterações

Importação CSV/XLSX com preview, mapeamento, normalização brasileira, duplicatas, limites, relatório e confirmação. O commit da importação agora usa transação serializável, recalculando plano/dados em cada tentativa e revertendo a tentativa integralmente em caso de falha. O comportamento concorrente precisa de teste PostgreSQL; não foi comprovado apenas por revisão.

Integração Meta do pacote incluída: cartão de conexão, nonce assinado por usuário, troca de código no backend, token AES-GCM, conferência WABA/número, inscrição do app, registro do número, desafio e assinatura do webhook, roteamento por número exclusivo, transação e deduplicação de mensagens. Não há envio automático, importação de conversas antigas nem agenda. Apenas números brasileiros são aceitos. Links wa.me preservados.

Dependências: Zod 3.25.76 mantém API v3 e permite o subpath exigido pelo lint; overrides npm reproduzem as versões Motion já fixadas nas resolutions Yarn. Lockfile npm acrescentado. Scripts de teste usam `node --import tsx` para evitar IPC do CLI tsx bloqueado neste ambiente. O lint deixa de analisar o kit JavaScript de terceiros em `public/abacus-viz`; regras do código da aplicação não foram desativadas.

## Evidências reais

Ambiente: Node 24.22.1, npm 11.9.0; engines do projeto exigem Node >=20.9.

| Verificação | Resultado |
| --- | --- |
| Instalação npm | Aprovada, com ignore-scripts e legacy-peer-deps; não comprova instalação padrão na Abacus |
| Prisma generate | Aprovado, cliente 6.7.0 gerado; sem conexão ao banco |
| Prisma validate | Aprovado com URL local fictícia apenas para validação sintática; nenhuma conexão foi feita |
| npm run test:import | 11/11 aprovados, incluindo roundtrip XLSX, CSV, telefones e campos |
| npm run test:whatsapp | 6/6 aprovados, assinatura, criptografia, parser, origem e nonce |
| npx tsc --noEmit | Aprovado após gerar Prisma e estabilizar dependências |
| npm run lint | Reprovado: 13 erros e 18 avisos remanescentes em arquivos já existentes |
| Lint dos módulos novos | Aprovado, incluindo todos os testes e XLSX |
| Build Next.js | Aprovado com NEXT_DIST_DIR=.build NEXT_TELEMETRY_DISABLED=1 npm run build |
| git diff --check | Aprovado |
| HTTP local do build de produção | 15/15 aprovados: páginas públicas, redirecionamento sem sessão, APIs recusando acesso sem login, desafio webhook, HMAC inválido, payload vazio assinado e JSON inválido |

Uma execução intermediária do build falhou por cache Turbopack inválido; a repetição em `.build` limpa passou. Execuções durante a preparação de dependências falharam e foram corrigidas antes dos resultados finais acima. Não confundir esses resultados com teste de produção. Os testes HTTP usaram segredos fictícios locais, nenhum usuário autenticado e nenhum banco. Uma tentativa de acessar o servidor por outro processo isolado falhou com ECONNREFUSED; iniciar servidor e verificações no mesmo processo resolveu a limitação.

## Banco, backup e rollback

Não existe histórico Prisma migrations no repositório inspecionado. `database/2026-11-01-candidate.sql` foi gerado por diff entre schema GitHub e schema novo, contém apenas adições, mas NÃO representa o estado confirmado do banco real. Não está em `prisma/migrations` para evitar aplicação automática antes de verificar drift e baseline.

Antes de aplicar: identificar DATABASE_URL no cofre da Abacus sem exibir seu valor; inspecionar tabelas e histórico real; gerar dump PostgreSQL consistente, registrar hash e versão; restaurar em banco isolado; conferir contagens e relações; aplicar candidato nessa cópia e testar importações concorrentes, leads existentes e duas contas. Depois revisar locks e estratégia de migration de produção. Não usar seed nem db push indiscriminado.

Rollback de código: manter versão anterior da Abacus e o commit base. As alterações propostas no banco são aditivas; após rollback de aplicação, manter tabelas e colunas novas, sem apagá-las. Restaurar backup sobre produção só com plano explícito para preservar gravações posteriores ao backup e autorização, pois restauração pode sobrescrever dados.

## Meta e requisitos externos

Configurar no cofre seguro da Abacus: META_APP_ID, META_APP_SECRET, META_EMBEDDED_SIGNUP_CONFIG_ID, META_GRAPH_API_VERSION, META_WEBHOOK_VERIFY_TOKEN e WHATSAPP_TOKEN_ENCRYPTION_KEY. Preservar AUTH_SECRET/NEXTAUTH_SECRET e DATABASE_URL reais. Nenhum desses valores foi configurado ou inventado nesta revisão.

Confirmar aplicativo Meta e autorização de empresa elegível, Login for Business/Embedded Signup vigente, domínios HTTPS, callback `/api/whatsapp/meta-webhook`, campo messages, permissões whatsapp_business_management e whatsapp_business_messaging, Advanced Access/App Review e requisitos de onboarding de terceiros aplicáveis ao modelo Tech Provider. A coleção oficial Meta no Postman foi consultada; a página Meta vinculada retornou 429. A versão e os requisitos atuais precisam de confirmação direta no painel/documentação antes da ativação.

Expiração/revogação proativa de tokens, reautorização, callbacks de revogação, limites operacionais, fila/retentativas duráveis e tratamento de coexistência ainda precisam de implementação/validação adicional. A desconexão atual é local; a revogação na Meta é independente. Não classificar o ciclo de autenticação como completo.

## Aceitação pendente e bloqueios

- Login autorizado na Abacus para confirmar projeto, domínio, configuração, banco e publicação sem créditos pagos adicionais.
- Resolver 13 erros de lint existentes antes de aprovar merge/publicação.
- Backup restaurado e migração testada em PostgreSQL, sem perdas.
- Cadastro/login reais, criação/edição, limites concorrentes entre API manual/importação/webhook, preservação de histórico, funil e follow-ups.
- Fluxo Meta com conta autorizada e mensagem real, repetição de evento, assinatura inválida, expiração/revogação e isolamento de duas contas.
- Preview e layout mobile, publicação na Abacus original e verificação de logs/dados após publicação.

Não há comprovação de integração WhatsApp ativa nem de atualização do site publicado. Nenhum serviço novo foi contratado e nenhuma hospedagem alternativa foi criada.
