// src/scripts/documentos-legais/tratamento-dados.ts
/**
 * Registro das operações de tratamento de dados (ROPA) do GuiaBG — versão 2.0.
 *
 * Markdown simples, sem HTML. Publicado por
 * src/scripts/publicar-documentos-legais.ts.
 */
export const TRATAMENTO_DADOS = `Última atualização: outubro de 2026.

## 1. Objetivo e escopo

Este documento é o registro simplificado das operações de tratamento de dados pessoais (ROPA) do GuiaBG, mantido para atender ao art. 37 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e para orientar a operação do guia. Ele descreve, para cada operação, os dados tratados, a finalidade, a base legal, as categorias de titulares, os destinatários, o prazo de retenção e as medidas de segurança adotadas.

O escopo abrange a instância de Bento Gonçalves/RS, disponível em https://guiabg.com.br, incluindo o site público, o painel administrativo, o banco de dados PostgreSQL, o armazenamento de imagens e backups, o envio de e-mails transacionais e os registros de auditoria. O documento complementa a Política de Privacidade e os Termos de Uso; em caso de dúvida sobre direitos do titular, prevalece a política publicada e a legislação aplicável.

O GuiaBG é um projeto de código aberto. O código pode ser auditado publicamente, o que ajuda a verificar como os dados são coletados, armazenados e exibidos. A auditoria do código não dá acesso à base de produção, que permanece restrita à administração e aos operadores contratados.

## 2. Princípios aplicados (art. 6º)

- **Finalidade:** cada operação tem propósito legítimo, específico e informado ao titular, descrito neste registro e na política.
- **Adequação:** os dados coletados são compatíveis com a finalidade declarada, sem uso secundário incompatível.
- **Necessidade:** buscamos o mínimo necessário para analisar a solicitação, publicar a ficha e manter a segurança, evitando campos supérfluos.
- **Livre acesso:** o titular pode consultar a política, saber quais dados são tratados e pedir acesso pelo canal do DPO.
- **Qualidade:** solicitamos que os dados sejam exatos e atualizados, e mantemos rotinas de correção e de anonimização.
- **Transparência:** informamos as finalidades, as bases legais, os operadores e os prazos em linguagem acessível.
- **Segurança:** aplicamos controles técnicos e administrativos proporcionais ao risco, com registro de ações e backups.
- **Prevenção:** limitamos acessos, registramos tentativas, moderamos conteúdo e revisamos permissões antes de ampliar o uso.
- **Não discriminação:** os dados não são usados para tratamento ilícito ou abusivo, nem para decisões injustificadas.
- **Responsabilização:** mantemos este registro, os logs de auditoria e os canais de atendimento para comprovar a conformidade.

## 3. Registro das operações de tratamento

### 3.1 Recebimento de solicitação

**Dados tratados:** nome, e-mail e telefone do solicitante; declaração de vínculo; dados do comércio informados no formulário; imagens e anexos opcionais; data e hora; endereço IP; user-agent; versão do termo aceito; mensagens de atendimento.

**Finalidade:** receber o pedido de inclusão ou atualização, identificar o solicitante, verificar duplicidade e viabilizar a análise.

**Base legal:** consentimento do titular (art. 7º, I) e execução de procedimentos preliminares a pedido do titular (art. 7º, V).

**Titulares:** solicitantes, representantes de comércios e pessoas mencionadas nos dados enviados.

**Destinatários:** administradores autorizados; Neon (banco de dados); Vercel (aplicação); Resend (confirmação por e-mail); Cloudflare R2 (anexos e imagens).

**Retenção:** durante a análise e por até 2 anos após o estado terminal da solicitação, quando os dados pessoais do solicitante são anonimizados ou eliminados, salvo obrigação legal de conservação.

**Segurança:** transmissão por TLS, acesso autenticado, validação de entrada, limite de tentativas, registro de auditoria e backup privado.

### 3.2 Moderação e publicação de ficha

**Dados tratados:** dados do comércio, categorias, horários, contatos públicos, descrição, imagens aprovadas, decisão administrativa, justificativa interna, data e responsável pela análise.

**Finalidade:** avaliar o pedido, corrigir informações, publicar ou atualizar a ficha e manter o histórico da decisão.

**Base legal:** consentimento (art. 7º, I); legítimo interesse na organização de informações de interesse comunitário (art. 7º, IX); cumprimento de obrigação legal (art. 7º, II), quando aplicável.

**Titulares:** responsáveis pelos comércios, profissionais autônomos e pessoas cujos dados constem da ficha.

**Destinatários:** administradores; Neon; Vercel; Cloudflare R2; visitantes do site, apenas para os dados publicados na ficha.

**Retenção:** enquanto a ficha estiver publicada e, após a despublicação, pelo prazo necessário à auditoria e à defesa de direitos, observados os prazos legais.

**Segurança:** controle de acesso por perfil, revisão humana antes da publicação, registro de auditoria, histórico de alterações e separação entre dados públicos e observações internas.

### 3.3 Moderação de imagens e anexos

**Dados tratados:** arquivos enviados, nome do arquivo, tipo, tamanho, metadados de envio, vínculo com a ficha ou solicitação, decisão de moderação e justificativa.

**Finalidade:** verificar adequação, qualidade, direitos de uso, direito de imagem e ausência de conteúdo proibido antes da publicação.

**Base legal:** consentimento (art. 7º, I); legítimo interesse na proteção de direitos de terceiros e na segurança do serviço (art. 7º, IX).

**Titulares:** autores das imagens, pessoas retratadas e titulares de marcas eventualmente exibidas.

**Destinatários:** administradores; Cloudflare R2 (armazenamento); Neon (metadados); Vercel (processamento).

**Retenção:** imagens aprovadas enquanto a ficha estiver publicada; imagens recusadas por até 90 dias para reavaliação e defesa, salvo necessidade de conservação por incidente ou disputa.

**Segurança:** validação de tipo e tamanho, armazenamento em bucket com controle de acesso, URLs não previsíveis quando aplicável, moderação humana e registro da decisão.

### 3.4 Fórum

**Dados tratados:** identificador do autor, tipo de publicação, conteúdo, comentário respondido, data de criação e de edição, indicador de edição e vínculo com a ficha ou contestação.

**Finalidade:** registrar manifestações, debates e esclarecimentos sobre fichas e decisões, com histórico para consulta e auditoria.

**Base legal:** legítimo interesse na transparência e no debate comunitário (art. 7º, IX); consentimento (art. 7º, I), quando o conteúdo for fornecido pelo titular.

**Titulares:** administradores e pessoas mencionadas nas publicações.

**Destinatários:** administradores; visitantes do site, para o conteúdo publicado; Neon; Vercel.

**Retenção:** enquanto a publicação permanecer no ar e, após a remoção, por até 2 anos em registros de auditoria, salvo prazo legal diverso.

**Segurança:** autenticação para publicar, moderação, registro de edição, controle de acesso e possibilidade de remoção a qualquer tempo.

### 3.5 Votação

**Dados tratados:** identificador da votação, pergunta, tipo, quórum, maioria, prazo, identificador do administrador votante, escolha, data e hora do voto, totais apurados e resultado.

**Finalidade:** registrar a decisão colegiada sobre contestações e casos sensíveis, com quórum e maioria definidos, preservando o histórico de governança.

**Base legal:** legítimo interesse na governança e na prestação de contas (art. 7º, IX); cumprimento de obrigação legal (art. 7º, II); exercício regular de direitos (art. 7º, VI).

**Titulares:** administradores votantes e pessoas envolvidas na contestação.

**Destinatários:** administradores; Neon; Vercel; órgãos de controle ou autoridades, quando requisitado.

**Retenção:** durante a votação e por até 5 anos após o encerramento, para comprovar o processo decisório e defender direitos.

**Segurança:** autenticação, voto único por administrador, restrição de acesso, registro de auditoria e apuração conferida.

### 3.6 Autenticação de administradores

**Dados tratados:** nome, e-mail, senha armazenada como hash, versão do token, data de criação, último acesso, endereço IP, user-agent, sessão e eventos de login e falha.

**Finalidade:** autenticar administradores, controlar permissões, detectar acessos indevidos e permitir a revogação de sessões.

**Base legal:** execução de contrato ou procedimentos preliminares (art. 7º, V); legítimo interesse na segurança (art. 7º, IX); cumprimento de obrigação legal (art. 7º, II).

**Titulares:** administradores do guia.

**Destinatários:** administradores autorizados; Neon; Vercel; Sentry, quando configurado, para erros.

**Retenção:** enquanto o acesso estiver ativo e por até 6 meses após a revogação, para investigação e defesa; logs de segurança conforme a operação 3.7.

**Segurança:** hash de senha com algoritmo robusto, cookies httpOnly, expiração de sessão, revogação por versão de token, limitação de tentativas e registro de eventos.

### 3.7 Logs de auditoria

**Dados tratados:** identificador do ator, tipo de ator, ação, entidade afetada, estado anterior e posterior, justificativa, data e hora, endereço IP, user-agent e identificador da requisição.

**Finalidade:** comprovar decisões, investigar incidentes, atender auditorias e exercer direitos em processos administrativos ou judiciais.

**Base legal:** cumprimento de obrigação legal (art. 7º, II) e exercício regular de direitos (art. 7º, VI).

**Titulares:** administradores, solicitantes e pessoas afetadas por decisões registradas.

**Destinatários:** administradores autorizados; Neon; Vercel; autoridades competentes, quando requisitado.

**Retenção:** em regra, 5 anos, podendo ser prorrogada para investigação de incidente ou defesa em processo.

**Segurança:** gravação append-only, acesso restrito, integridade protegida por controle de banco, consulta por perfil e backup.

### 3.8 Backups

**Dados tratados:** cópia das tabelas do banco, incluindo dados pessoais e metadados, manifesto com contagem e hash dos arquivos.

**Finalidade:** recuperar o serviço em caso de falha, erro humano, ataque ou desastre, e cumprir requisitos de continuidade.

**Base legal:** cumprimento de obrigação legal (art. 7º, II); legítimo interesse na segurança e na continuidade do serviço (art. 7º, IX).

**Titulares:** todos os titulares cujos dados estejam nas tabelas copiadas.

**Destinatários:** Cloudflare R2, em bucket privado distinto do bucket público de imagens; administradores autorizados.

**Retenção:** até 30 dias, prazo padrão configurável, com eliminação automática ao fim do período.

**Segurança:** bucket privado, credenciais separadas, hash de integridade, restauração testada e acesso restrito.

### 3.9 E-mail transacional

**Dados tratados:** nome, e-mail, assunto, conteúdo da mensagem, data de envio, status de entrega e identificadores técnicos do provedor.

**Finalidade:** confirmar recebimento, informar decisão, enviar link de recuperação de senha e comunicar incidentes ou mudanças relevantes.

**Base legal:** execução de procedimentos preliminares ou de contrato (art. 7º, V); legítimo interesse na comunicação do serviço (art. 7º, IX); cumprimento de obrigação legal (art. 7º, II), quando aplicável.

**Titulares:** solicitantes e administradores.

**Destinatários:** Resend; provedores de e-mail dos destinatários; administradores.

**Retenção:** pelo tempo necessário à entrega e à comprovação, conforme o contrato do provedor, com minimização do conteúdo.

**Segurança:** transmissão TLS, domínio autenticado com SPF e DKIM, credenciais restritas e registro de envio.

## 4. Pseudonimização, anonimização e criptografia

A anonimização é aplicada quando os dados deixam de ser necessários para a finalidade original. No fluxo de solicitações, os campos de identificação pessoal do solicitante são substituídos por marcador, preservando dados estatísticos e o histórico da decisão. A pseudonimização pode ser usada em conjuntos de teste e em relatórios internos, com identificadores substituídos e acesso restrito.

A criptografia é usada em trânsito, com TLS nas conexões entre navegador, aplicação e banco. Senhas são armazenadas com função de hash adequada e nunca em texto claro. Tokens de sessão são assinados e enviados em cookies httpOnly. Os provedores de banco e de armazenamento aplicam criptografia em repouso conforme seus contratos. Não usamos criptografia ponta a ponta, porque a aplicação precisa ler os dados para exibir fichas e processar solicitações.

## 5. Gestão de incidentes de segurança (art. 48)

Um incidente é tratado em etapas: detecção, contenção, avaliação, comunicação, correção e aprendizado. A detecção pode ocorrer por alerta de monitoramento, revisão de logs, denúncia de titular ou identificação da equipe. A contenção busca limitar o alcance, revogar acessos, rotacionar credenciais, isolar serviços e preservar evidências.

Na avaliação, verificamos a natureza dos dados, a quantidade de titulares afetados, o risco de dano, a causa provável e as medidas já adotadas. Quando o incidente puder acarretar risco ou dano relevante, comunicamos a ANPD e os titulares afetados, observado o prazo de 3 dias úteis previsto na regulamentação da ANPD, quando aplicável, com as informações disponíveis e as medidas de mitigação.

O incidente é registrado em log próprio, com cronologia, decisões, comunicações e responsáveis. Depois da correção, fazemos análise de causa raiz, atualizamos controles, revisamos este registro e, se necessário, comunicamos novos fatos aos titulares e à autoridade.

## 6. Governança, papéis e revisão

A administração do GuiaBG atua como controladora e responde pelas decisões de tratamento. O DPO é o canal de comunicação com titulares e com a ANPD e acompanha pedidos, incidentes e revisões. Os administradores acessam apenas o necessário para suas funções, com autenticação individual e registro de ações. Os operadores são avaliados antes da contratação e devem oferecer garantias de segurança e de proteção de dados.

Revisamos este registro, no mínimo, anualmente e sempre que houver mudança relevante de funcionalidade, operador, base legal ou risco. Novos tratamentos passam por avaliação de necessidade e, quando o risco for alto, por avaliação de impacto à proteção de dados (art. 38 da LGPD). Mudanças em documentos legais geram nova versão, publicada com data e preservada no histórico.

O código aberto permite auditoria por terceiros e serve como mecanismo adicional de transparência. Quem replica o projeto assume o papel de controlador da sua instância e deve revisar este documento, adequar os operadores e cumprir as obrigações locais.

## 7. Contato e referências

Dúvidas sobre este registro podem ser enviadas ao DPO em dpo@guiabg.com.br. Assuntos gerais: contato@guiabg.com.br. Referências principais: Lei nº 13.709/2018 (LGPD), especialmente os arts. 6º, 7º, 18, 37, 38, 41, 46, 48 e 49; regulamentações da ANPD; Lei nº 12.965/2014 (Marco Civil da Internet); e a Política de Privacidade publicada no site.`;
