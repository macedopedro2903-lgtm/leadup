# LeadUp — atualização de importação de leads

Esta atualização mantém a landing page e os preços existentes. Foi adicionada uma área em `/app/importar` para importar CSV e XLSX com mapeamento de colunas e conferência antes de salvar.

## O que foi feito

- Importação de até `MAX_IMPORT_ROWS` registros por arquivo (`config/app.ts`; padrão: 1000) e arquivo de até 2 MB.
- Mapeamento manual e detecção de nomes de colunas equivalentes.
- Normalização de telefones brasileiros para `55 + DDD + número`.
- Deduplicação por usuário + telefone normalizado, inclusive em novos cadastros manuais.
- Tratamento de linhas inválidas e exportação de relatório de erros.
- Política configurável para leads já existentes: pular, atualizar campos preenchidos ou mesclar observações, preservando o cadastro e histórico.
- Respeito aos limites de leads ativos nos planos atuais.
- Registro de auditoria da importação, sem salvar o arquivo original no servidor.
- Estrutura de banco para mensagens recebidas (`LeadMessage`) e função `recordVerifiedInboundMessage`, que **deve ser chamada apenas após autenticação do webhook de um provedor WhatsApp**.

## Antes de colocar em produção

1. Na pasta do projeto, execute `npm install` (ou seu gerenciador habitual).
2. Preencha as variáveis de ambiente indicadas em `.env.example` no painel da hospedagem, **sem publicar segredos no GitHub**.
3. No banco de testes, execute `npx prisma generate` e `npx prisma db push`. Faça backup do banco de produção antes de aplicar qualquer alteração de schema.
4. Execute `npx tsx scripts/backfill-phones.ts` para normalizar telefones antigos. O script informa quantos cadastros duplicados precisam de revisão; ele **não apaga nem mescla registros**.
5. Execute `npm run test:import` e `npm run build`, e faça testes no banco de testes antes de publicar.
6. Faça o deploy da versão verificada usando o processo de deploy existente (GitHub/Vercel, Abacus etc.).

## Importante sobre o WhatsApp

O ZIP original possui links `wa.me` para iniciar mensagens, mas não contém integração de entrada de mensagens de um provedor WhatsApp. A função de ingestão preparada em `lib/whatsapp-inbound.ts` **não ativa a sincronização automaticamente**. Falta configurar um provedor autorizado, autenticar as notificações recebidas, vincular cada instância WhatsApp à conta correta e chamar a função somente após essa verificação. Não exponha a função em uma API sem verificar a assinatura e a identidade da conta.

## Limitações desta entrega

- A importação foi implementada no código, mas não foi testada ponta a ponta contra o PostgreSQL de produção nem com um navegador real, pois as dependências e um ambiente de testes conectado não acompanharam o ZIP.
- Não há uma ferramenta visual para mesclar dois leads antigos manualmente. A atualização/mesclagem das planilhas preserva o lead existente, e o backfill detecta conflitos históricos.
- A recepção automática de mensagens pelo WhatsApp ainda depende de um provedor e de uma integração com webhook autenticado.
- Não publique o `.env` do arquivo enviado. Ele continha valores que aparentam ser credenciais reais; este ZIP atualizado inclui somente `.env.example`. Caso aquele ZIP tenha sido compartilhado, substitua os segredos originais.

## Integração oficial Meta Cloud API

Há uma implementação complementar (autorização individual, registro de número e webhook assinado) descrita em `README_WHATSAPP_META.md`. Essa integração **não está ativa na Abacus** sem configurar a Meta, preparar o PostgreSQL e validar o webhook real.
