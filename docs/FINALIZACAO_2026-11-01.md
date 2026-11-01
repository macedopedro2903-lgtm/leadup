# LeadUp — etapa comercial e preparação de publicação

Estado: implementação em revisão; não declarar publicação ou WhatsApp ativo com base neste documento.

## Alterações desta etapa

- Sete etapas comerciais, preservando os valores existentes do enum. Etapas novas também ocupam o limite Free.
- Criação/reativação manual de leads passa a compartilhar isolamento serializável e limites com importação e webhook. Valores e datas inválidos são recusados; números decimais não perdem a vírgula/ponto de centavos.
- Orçamentos vinculados ao proprietário e ao lead, valores Decimal(12,2), validade, status, revisão otimista e histórico imutável de alterações comerciais. Marcar como enviado não transmite uma mensagem.
- Lembretes por lead, opção de desativar, prazo por inatividade e data agendada prioritária. Alertas são calculados no dashboard; não dependem de um cron para aparecer e não enviam mensagens.
- Dashboard inclui novos leads, propostas enviadas, vendas, conversão e valores de leads fechados. Atualização por polling a cada 15 segundos com a página visível, não WebSocket.
- Histórico das últimas 100 mensagens recebidas e últimas 100 alterações comerciais disponível ao proprietário do lead.
- Recuperação de senha com token aleatório de uso único, apenas SHA-256 armazenado, prazo de 30 minutos, throttling por conta e invalidação das sessões antigas. Envio real depende de RESEND_API_KEY e PASSWORD_RESET_FROM verificado; sem essas configurações a interface informa indisponibilidade. Nenhum serviço foi contratado.
- Conexões Meta com expiração conhecida são invalidadas na consulta; erros de autorização 190/102 da Graph API exigem reconexão e removem o token. A checagem online é limitada a uma vez a cada cinco minutos quando o proprietário consulta a conexão. Indisponibilidade de rede não revoga a conexão. Não há cron de saúde nem callback de desautorização nesta etapa.
- Menu mobile tem controles acessíveis de abrir/fechar e fecha ao navegar.

## Banco e testes

`2026-11-01-candidate.sql` é o candidato completo desde o schema original GitHub. `2026-11-01-commercial-increment.sql` é apenas o incremento sobre o schema de importação/WhatsApp já testado na cópia restaurada. Não executar os dois sobre o mesmo banco. Alterações aditivas, sem seeds e sem remoção de registros.

Testes locais já executados: Prisma generate, 11 importação, 7 Meta, 4 comerciais, TypeScript, lint sem erros (18 avisos) e build. A suíte integrada ampliada ainda precisa rodar na cópia restaurada após o incremento, incluindo orçamentos, isolamento, concorrência manual/importação, expiração de conexão e recuperação de senha. O envio de email real não foi testado.

## Meta e ausência de CNPJ

Portfólio 1946288456346122 não verificado; app 1447888187480198 não publicado; Embedded Signup v4 configurado (2580937555653151), domínio original na lista do SDK. Número oficial de teste +1 (555) 606-2760, Phone Number ID 1510511172140395, conta de mensagens 2170374713570601. Nenhum token gerado, destinatário adicionado ou mensagem real recebida. Não há credenciais Meta configuradas na Abacus.

O titular informou não possuir CNPJ. O painel exige verificação empresarial para integrar clientes externos, App Review e verificação de acesso para produção. Não foi confirmada aprovação desse modelo de SaaS apenas com CPF. Não enviar dados empresariais inventados ou emprestados.

A documentação oficial da Twilio oferece Sandbox para desenvolvimento sem aguardar registro/verificação do remetente, limitado a testes. Isso requer conta/credenciais e participação autorizada dos destinatários; não foi contratado ou configurado e não libera produção. A documentação de parceiros 360dialog exige o programa Tech Provider para ISVs, portanto não comprova uma dispensa da verificação para este SaaS.

Fontes consultadas:
- https://www.twilio.com/docs/whatsapp/sandbox
- https://www.twilio.com/docs/whatsapp/quickstart
- https://docs.360dialog.com/partner/get-started/tech-provider-program
- Configurador autenticado Meta do aplicativo LeadUp.

## Produção

Até este registro, o código canônico, banco e domínio original não foram substituídos. É necessário validar o incremento em restauração, revisar mobile, confirmar publicação por checkpoint da Abacus e renovar backup antes de uma migração no banco original. O WhatsApp deve continuar indisponível no produto enquanto faltarem chaves e aprovações; sua ausência não impede publicar os recursos comerciais validados.
