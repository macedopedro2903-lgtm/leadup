# LeadUp — integração oficial WhatsApp Business Platform (Cloud API)

## O que foi implementado no código

- Cartão **Integração oficial com WhatsApp** em `/app/configuracoes`, usando cadastro incorporado (Embedded Signup v4) e autorização individual pelo próprio titular, via Meta Facebook Login for Business.
- Rotas autenticadas `GET/POST/DELETE /api/whatsapp/connect` (estado da conexão, conexão, remoção local); `POST /api/whatsapp/register` (registro do número com PIN de seis dígitos).
- Cada usuário LeadUp tem no máximo uma conexão WhatsApp Cloud API; `phoneNumberId` é exclusivo globalmente, proibindo vincular o mesmo número a contas LeadUp diferentes.
- Código temporário de autorização trocado no backend, sem enviar token ao navegador. Token do proprietário salvo usando AES-256-GCM com chave de ambiente; não vai para logs nem para o cliente.
- Confirmação pelo Graph API de que o `phone_number_id` pertence à WABA autorizada; inscrição do aplicativo nos webhooks da WABA.
- `GET/POST /api/whatsapp/meta-webhook`: desafio Meta (`hub.challenge`), HMAC SHA-256 do corpo bruto (`x-hub-signature-256`), roteamento por número de destino **conectado**, filtragem de notificações de entrega/status, deduplicação de ID de mensagem, criação automática de lead brasileiro e registro de mensagem.
- Transação serializável no registro de mensagens: preserva histórico, resiste a reentregas e evita exceder o limite de leads ativos FREE sob concorrência.
- Mensagens que não puderam criar lead por limite do plano ou duplicatas legadas exigindo revisão incrementam um contador de eventos ignorados e exibem aviso ao proprietário.
- Desconexão local remove o token armazenado, **sem apagar leads, mensagens nem histórico**.

**Não há envio automático de mensagens** nesta implementação. Os links `wa.me` anteriores foram preservados. O WhatsApp Cloud API não fornece importação livre de agenda telefônica nem de conversas antigas por esta integração; apenas eventos novos entregues após a conexão e assinatura correta do webhook. Leads são criados para **mensagens recebidas depois da ativação**, em números brasileiros válidos.

## O que é indispensável antes de ativar

1. Ter autorização de uma empresa elegível e uma conta Meta Business adequada, incluindo etapas exigidas pela Meta de verificação/avaliação do app e permissões adequadas. Não tente contornar regras de cadastro, idade ou verificação da Meta.
2. Criar/configurar um aplicativo Meta com **WhatsApp Cloud API** e **Facebook Login for Business**, com configuração **WhatsApp Embedded Signup v4**. Confirme a versão e os requisitos vigentes no painel Meta antes de ativar; a documentação atual não pôde ser integralmente recuperada nesta revisão.
3. Obter acesso/autorização para `whatsapp_business_management` e `whatsapp_business_messaging` e demais permissões que a modalidade/avaliação da Meta efetivamente exija; adicionar os domínios e URLs HTTPS exigidos em *Allowed Domains for JavaScript SDK / OAuth Settings*. O uso com múltiplas empresas requer habilitação/aprovação adequada para onboarding de clientes, conforme a modalidade da Meta.
4. Em **WhatsApp > Configuration > Webhooks** no painel Meta, configurar callback público `https://SEU_DOMINIO_REAL/api/whatsapp/meta-webhook` com verificação via `META_WEBHOOK_VERIFY_TOKEN`; inscrever o campo **messages** e verificar as configurações do app. O backend inscreve o app na WABA autorizada após o Embedded Signup.
5. Preencher em **segredos protegidos** do projeto original Abacus: `DATABASE_URL`, `AUTH_SECRET`/`NEXTAUTH_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `META_EMBEDDED_SIGNUP_CONFIG_ID`, `META_GRAPH_API_VERSION`, `META_WEBHOOK_VERIFY_TOKEN` e `WHATSAPP_TOKEN_ENCRYPTION_KEY` e `LEADUP_PUBLIC_ORIGIN`. A chave AES é um valor BASE64 de 32 bytes aleatórios; **nunca** coloque credenciais em arquivos do GitHub, no prompt ou nos logs. O registro deve usar um PIN de seis dígitos escolhido pelo proprietário no fluxo do aplicativo.
6. Habilitar HTTPS e cookies seguros; a conexão verifica sessão de login e origem. Configure `LEADUP_PUBLIC_ORIGIN=https://leadup.abacusai.app` no projeto existente. O backend compara Origin com essa configuração explícita para funcionar atrás do proxy; não confia em X-Forwarded-Host.
7. Verificar que o banco original já contempla a atualização de importação (`normalizedPhone`, `LeadMessage`, etc.). Em banco de teste, comparar schemas, realizar migração **aditiva** para a tabela `WhatsAppConnection` e validação; **não execute `prisma db push` no banco real sem avaliação de mudanças destrutivas**.
8. Fazer backup e **validar a restauração** do PostgreSQL original antes de migrations em produção. Não execute scripts de seed em produção.
9. Conferir permissões, prazos de acesso e possível expiração do token Business Integration System User; reautorização pode ser necessária. Ao desconectar, o usuário deve também revogar a autorização nas configurações Meta se quiser revogação remota.
10. Implementar controle operacional de taxa nas rotas, retenção de mensagens, política de privacidade/LGPD e monitoramento de erros/reentregas adequado ao tráfego antes de liberar para clientes reais.

## Testes

```bash
npm install
npx prisma generate
npm run test:import
npm run test:whatsapp
npx tsc --noEmit
npm run lint
npm run build
```

O código pode executar os testes unitários do webhook isoladamente com Node 22:

```bash
node --experimental-strip-types --test tests/whatsapp-meta.test.ts
```

**Teste de aceitação:** use uma conta WhatsApp Business de testes autorizada pela Meta, complete Embedded Signup v4, registre um número de testes com o PIN, envie uma mensagem real, confirme que `Lead`/`LeadMessage` foram gravados no usuário correto, reenvie o mesmo webhook e confirme ausência de duplicata, teste outra conta/telefone e assinatura inválida, limites de plano, desconexão, e uma restauração do backup em ambiente de testes. Só então publique na Abacus. Não marque como validado antes de obter esses resultados.

## Segurança e limitações

- `META_APP_SECRET`, tokens dos clientes, chave de criptografia e `DATABASE_URL` nunca devem ser públicos. Não solicite que usuários os enviem em chats.
- Cada callback tem assinatura do app Meta, mas **não** uma assinatura separada por cliente; o isolamento ocorre pela associação exclusiva de `phone_number_id` ao usuário autenticado que autorizou a WABA.
- Mensagens de texto, legendas e marcadores para outros tipos de mensagem são salvos; arquivos de mídia não são baixados.
- Os eventos recebidos para números internacionais são ignorados pelo normalizador brasileiro atual; não altere essa regra silenciosamente se pretende vender para outros países.
- O sistema não garante a continuidade do recebimento enquanto a Meta/Abacus estiverem indisponíveis; adicione fila durável e alertas se a operação crescer.
- Registro de PIN no Graph API é um passo obrigatório para números novos. Algumas modalidades de coexistência e migração de número têm fluxos próprios que ainda precisam ser implementados/testados se forem ofertados.
- A UI diz "conectado" após a Meta confirmar o registro do telefone; **recebimento realmente funcional requer teste de webhook no ambiente de produção**. Não anuncie integração concluída sem ele.
- Implantação/backup/credenciais Meta/ativação no projeto real Abacus **não foram realizados nesta entrega**.

## Referências técnicas

- Meta Embedded Signup: https://www.postman.com/meta/whatsapp-business-platform/documentation/du6gzjv/embedded-signup
- Meta Cloud API: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- Meta Webhook Signature: https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/
