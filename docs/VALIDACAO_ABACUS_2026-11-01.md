# LeadUp — relatório de validação após autenticação na Abacus

Atualizado em 01/11/2026. A atualização está em revisão, **não publicada**. Não confundir a cópia isolada de validação com o aplicativo público.

## A. Abacus

Acesso autenticado confirmado ao projeto `16bb691509`, conversa `30a119ee7`, aplicativo **LeadUp Site SaaS**. Endereço existente verificado no console e no navegador: https://leadup.abacusai.app/.

Versão marcada como implantada no console: **Corrige botão de assinatura Start via WhatsApp**, 01/11/2026 às 11:45. Ela continua sendo a versão pública; nenhuma nova implantação foi concluída nesta revisão. A conversa registra esgotamento dos créditos do agente. Nenhuma mensagem foi enviada ao agente pago e nenhum crédito adicional foi comprado.

O terminal do ambiente original foi acessado pelo computador disponibilizado pela Abacus. A atualização foi clonada e validada em diretório isolado; os arquivos canônicos do aplicativo publicado e seu domínio não foram substituídos.

## B. GitHub

Repositório original `macedopedro2903-lgtm/leadup`, branch `atualizacao-importacao-2026-11-01`, PR em rascunho https://github.com/macedopedro2903-lgtm/leadup/pull/1. `main` permanece sem merge.

Inclui importação, implementação inicial da integração Meta, ajustes de lint, lockfile e scripts de testes. A identidade visual, os preços e a cobrança foram preservados. Ajustes técnicos no carregamento de scripts, links e hooks precisam de conferência visual no preview final.

## C. Importação

Implementado em `/app/importar`: CSV e XLSX, preview sem gravação, detecção e mapeamento de colunas, normalização brasileira, validação por linha, políticas pular/atualizar/mesclar, relatório de erros, auditoria e confirmação.

**Testado com PostgreSQL restaurado e requisições HTTP autenticadas**: CSV e XLSX gravam registros; preview não grava; reimportação não duplica; conta diferente pode ter o mesmo telefone; mesclagem mantém ID, serviço preenchido e histórico; limite Free é respeitado; duas importações simultâneas não ultrapassam o limite. O commit usa transação serializável e reavalia os limites em cada tentativa.

Isso não valida toda combinação de concorrência entre importação, criação manual e mudança de status. O teste realizado de concorrência cobriu duas importações simultâneas.

## D. WhatsApp

Implementado no código: cartão de conexão, nonce assinado por usuário, troca de código no backend, AES-256-GCM, conferência WABA/número, inscrição do app, registro com PIN, desafio e HMAC do webhook, roteamento por número exclusivo, ingestão transacional e idempotência por usuário/mensagem. Links wa.me preservados.

Os testes integrados usaram **eventos assinados sintéticos**, contas locais e conexões de teste inseridas na cópia do banco. Confirmaram associação ao lead importado, separação de contas, deduplicação de reentrega, criação de novo contato, limite Free, rejeição de assinatura incorreta e desconexão local sem apagar histórico.

O teste encontrou falha na comparação de origem atrás do proxy. A correção acrescenta `LEADUP_PUBLIC_ORIGIN`, configurado explicitamente pelo administrador, sem confiar em X-Forwarded-Host. A versão corrigida passou nos testes integrados. A validação do nonce também passou a rejeitar segmentos extras no cookie.

**Pendente:** Embedded Signup real, autorização de empresa/número, recebimento real da Meta, expiração/revogação proativa e reautorização. Não há envio automático, importação de agenda ou conversas antigas. O normalizador atual aceita apenas telefones brasileiros. A desconexão implementada é local, sem revogar automaticamente a autorização na Meta.

## E. Meta

Autenticação e cadastro no Meta for Developers concluídos pelo titular. Com autorizações explícitas, foram criados:

- Portfólio empresarial **LeadUp**, ID `1946288456346122`, ainda **não verificado**.
- Aplicativo **LeadUp**, ID `1447888187480198`, caso de uso oficial WhatsApp, vinculado ao portfólio; **não publicado** na Meta.

A criação do app foi confirmada pelo painel autenticado. Foram informados e salvos o domínio `leadup.abacusai.app`, a URL de privacidade existente `/privacidade` e a URL de termos existente `/termos`. A política pública ainda se identifica como texto-base e indica `contato@leadup.com.br`, cuja operação não foi confirmada: exige revisão do responsável antes do envio para análise. Não foi cadastrada URL de exclusão, pois não existe um procedimento validado.

App Secret permanece mascarado; nenhum token ou segredo Meta foi copiado ao repositório ou configurado na Abacus. Não há permissões avançadas ou aprovação confirmadas. O primeiro acesso ao ambiente WhatsApp requer aceitar os Termos da Plataforma WhatsApp Business e os Termos da Cloud API; essa etapa específica ainda não foi aceita. Nenhum número de teste foi provisionado ou mensagem real enviada/recebida.

O painel confirma a exigência de verificação empresarial antes de acesso a dados de outras empresas e apresenta o onboarding como Provedor de Tecnologia. Ainda é necessário concluir esses requisitos, confirmar a versão vigente de Embedded Signup e permissões, configurar o callback HTTPS e campo messages, e validar o fluxo com uma conta autorizada.

Variáveis necessárias no cofre seguro do projeto original: `META_APP_ID`, `META_APP_SECRET`, `META_EMBEDDED_SIGNUP_CONFIG_ID`, `META_GRAPH_API_VERSION`, `META_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_TOKEN_ENCRYPTION_KEY`, `LEADUP_PUBLIC_ORIGIN`. Preservar `DATABASE_URL`, `AUTH_SECRET` e `NEXTAUTH_SECRET` existentes. Para o domínio atual, a origem pública é `https://leadup.abacusai.app`.

A coleção oficial Meta no Postman foi consultada; a documentação Meta vinculada retornou 429 na tentativa inicial. Versão, App Review, Advanced Access e requisitos Tech Provider devem ser confirmados diretamente no painel/documentação antes de liberar a integração a clientes.

## F. Banco, backup e restauração

O console permitiu inspeção somente de leitura do schema associado ao aplicativo. Foram observadas nove tabelas de negócio no schema público; os novos campos/tabelas ainda não estavam presentes e não foi observada `_prisma_migrations` nesse schema.

O pg_dump não foi concluído porque a credencial da aplicação não pode consultar a view `pg_settings`. Esse dump parcial NÃO é considerado um backup válido. Não houve ampliação de permissões para contornar a restrição.

Como alternativa, foi criado backup lógico das nove tabelas com Prisma em transação RepeatableRead, além de uma cópia privada do código. O arquivo de dados recebeu permissões privadas e manifesto SHA-256. Dados, hashes de senha, tokens e segredos não foram enviados ao GitHub.

O schema anterior foi recriado em PostgreSQL 15.19 isolado, acessível apenas por socket Unix privado com autenticação peer e sem listener de rede. O backup lógico foi restaurado em uma transação. **Todos os registros das nove tabelas tiveram correspondência integral com o backup**, não apenas contagens.

O SQL aditivo `docs/database/2026-11-01-candidate.sql` foi aplicado somente nessa cópia restaurada. O teste integrado posterior confirmou novamente que todos os campos originais dos registros do backup continuavam iguais. **Nenhuma migração foi aplicada ao banco original.** Isso é uma restauração lógica validada com o schema do código, não um dump físico completo da instância gerenciada, suas roles ou configurações internas.

## G. Resultados dos testes

| Verificação | Resultado e alcance |
| --- | --- |
| Instalação npm | Concluída em cópia isolada com ignore-scripts e legacy-peer-deps |
| Prisma generate | Aprovado no Work e na cópia da Abacus, cliente 6.7.0 |
| npm run test:import | 11/11 aprovados, incluindo roundtrip XLSX |
| npm run test:whatsapp | 7/7 aprovados após correção de origem/nonce |
| npx tsc --noEmit | Aprovado, inclusive na cópia Abacus antes do teste integrado final |
| npm run lint | Aprovado, zero erros e 18 avisos preexistentes |
| npm run build | Aprovado no Work e na Abacus com NEXT_DIST_DIR=.build e telemetria desativada |
| scripts/test-http.mjs | 15 verificações HTTP locais aprovadas, sem banco ou Meta reais |
| scripts/test-database.mjs | **20 verificações aprovadas** no build da Abacus contra PostgreSQL restaurado |
| Backup/restauração | Nove tabelas e todos os registros comparados integralmente; dados preservados após migração de teste |
| git diff --check | Aprovado para as alterações revisadas |

As 20 verificações integradas incluem cadastro e login de duas contas, páginas autenticadas, CRUD com acesso cruzado recusado, follow-up manual, importação/duplicatas, concorrência, planos, webhook sintético, proteção de origem, desconexão, logout e preservação do backup. Apenas fixtures criadas pelo teste foram removidas da cópia isolada; nenhum usuário ou dado original foi excluído.

Ambientes: Node 24.22.1 no Work e Node 22.23.4 observado no terminal Abacus. O teste completo não acessa IA paga nem faz chamadas reais à Meta. Houve reinícios da área de trabalho durante a preparação; os arquivos persistiram e o resultado final integrado foi conferido após a correção.

## H. Produção e rollback

O site público foi aberto e a landing/preços existentes foram confirmados. Isso confirma disponibilidade da versão antiga, **não publicação das novas funcionalidades**. Login real no domínio público, preview final e layout mobile da atualização ainda precisam de verificação.

Rollback planejado: manter a versão Abacus implantada e a cópia privada anterior do código. Uma futura migração aditiva não exige apagar as novas tabelas/colunas para reverter a aplicação. Restaurar dados sobre produção exige plano específico para preservar gravações posteriores ao backup; não foi feito nesta tarefa.

## I. Pendências

1. Aceitação específica dos termos WhatsApp/Cloud API, verificação do portfólio, requisitos de Provedor de Tecnologia, revisão dos textos legais, configuração do app/permissões e conta de teste autorizada. App e portfólio já criados; integração real ainda pendente.
2. Implementar e validar ciclo completo de expiração, revogação e reautorização antes de oferecer integração completa.
3. Confirmar acesso de login ao LeadUp no preview/publicação e revisar layout mobile.
4. Confirmar mecanismo de checkpoint/publicação do código atualizado no projeto original, sem consumir créditos pagos adicionais.
5. Atualizar backup antes de qualquer alteração futura no banco original, conferir drift final e aplicar apenas migração aprovada e validada.
6. Publicar na URL original somente após os critérios aplicáveis; conferir dados, autenticação, importação, logs e mensagem real após publicação.

Não há comprovação de WhatsApp ativo em produção. Nenhum serviço novo foi contratado, nenhum domínio foi alterado e nenhuma hospedagem alternativa foi criada.
