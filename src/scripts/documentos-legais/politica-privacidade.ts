// src/scripts/documentos-legais/politica-privacidade.ts
/**
 * Política de privacidade do GuiaBG — versão 2.0.
 *
 * Markdown simples, sem HTML. O texto é publicado no banco pela rotina
 * src/scripts/publicar-documentos-legais.ts.
 */
export const POLITICA_PRIVACIDADE = `Última atualização: outubro de 2026.

## 1. Quem é o controlador

O GuiaBG é um projeto comunitário e de código aberto que mantém um guia de comércios e serviços de Bento Gonçalves, no Rio Grande do Sul, no endereço https://guiabg.com.br. A administração do GuiaBG, com atuação em Bento Gonçalves/RS, é a controladora dos dados pessoais tratados no site, nos termos do art. 5º, VI, da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Isso significa que ela define quais dados são coletados, para quais finalidades, com quais bases legais e por quanto tempo são mantidos.

Quando o projeto é replicado por outra cidade, a instância local passa a ser a controladora dos dados que trata. O código é o mesmo e pode ser auditado por qualquer pessoa, mas cada operador responde pelas suas escolhas, pelos seus documentos e pelo cumprimento da LGPD no seu território.

## 2. Encarregado de dados (DPO)

O encarregado pelo tratamento de dados pessoais (DPO) é indicado pela administração e pode ser contatado em dpo@guiabg.com.br. Ele recebe reclamações e pedidos de titulares, orienta a equipe, acompanha as revisões desta política e serve de canal de comunicação com a Autoridade Nacional de Proteção de Dados (ANPD).

O contato institucional geral é contato@guiabg.com.br. Para assuntos de privacidade, prefira o endereço do DPO, que permite o registro e o encaminhamento adequado do pedido.

## 3. Quais dados coletamos

### 3.1 Dados de solicitantes

Quando você pede a inclusão ou a atualização de um comércio, coletamos nome, e-mail e telefone, além dos dados do comércio informados no formulário. Também registramos a declaração de vínculo, a data e a hora do envio, o endereço IP, o user-agent do navegador, a versão do documento aceito e as mensagens trocadas no atendimento.

### 3.2 Dados do comércio

A ficha pode conter nome fantasia, descrição, categorias, endereço, bairro, CEP, número, complemento, telefone, WhatsApp, Instagram, e-mail, site, horários de funcionamento, formas de atendimento, observações e imagens ou anexos enviados. Esses dados podem incluir informações de pessoa jurídica ou de profissional autônomo e, em alguns casos, dados pessoais do responsável pelo negócio.

### 3.3 Dados técnicos e logs

Para segurança, auditoria e funcionamento, registramos endereço IP, user-agent, data e hora de acesso, identificadores de requisição, rota acessada, resultado da operação e erros. Em ações administrativas, registramos o identificador do administrador, a ação realizada, a entidade afetada e a justificativa. Esses registros não são usados para perfilamento comercial.

### 3.4 Cookies e armazenamento local

Usamos cookies estritamente necessários para manter a sessão de administradores autenticados, com atributos de segurança adequados. A preferência de tema (claro, escuro ou sistema) é gravada no armazenamento local do navegador e pode ser reproduzida em cookie pelo provedor de tema; ela não identifica você e não é usada para rastreamento. Não usamos cookies de publicidade nem de perfilamento comportamental.

## 4. Para que usamos e com qual base legal

Cada tratamento tem uma finalidade determinada e uma base legal do art. 7º da LGPD:

- **Receber e analisar solicitações:** nome, e-mail, telefone, dados do comércio e declaração de vínculo, para viabilizar o pedido e respondê-lo. Base legal: consentimento do titular (art. 7º, I) e execução de procedimentos preliminares a pedido do titular (art. 7º, V).
- **Publicar e manter fichas:** dados do comércio e imagens, para divulgar informação de interesse comunitário. Base legal: consentimento (art. 7º, I) e legítimo interesse na organização de informações públicas (art. 7º, IX), com avaliação da expectativa legítima do titular.
- **Moderar conteúdo e imagens:** dados da solicitação, imagens e anexos, para verificar adequação, veracidade e direitos de terceiros. Base legal: legítimo interesse (art. 7º, IX) e cumprimento de obrigação legal (art. 7º, II), quando houver.
- **Segurança, prevenção a fraude e abuso:** IP, user-agent, data e hora, identificadores de requisição, para proteger o serviço, investigar incidentes e coibir uso indevido. Base legal: legítimo interesse (art. 7º, IX) e cumprimento de obrigação legal (art. 7º, II).
- **Auditoria e exercício regular de direitos:** logs de ações, aceites e decisões, para comprovar conformidade e defender o guia em eventuais disputas. Base legal: cumprimento de obrigação legal (art. 7º, II) e exercício regular de direitos (art. 7º, VI).
- **E-mail transacional:** nome e e-mail, para confirmar recebimento, informar decisão, enviar link de recuperação de senha e comunicar incidentes. Base legal: execução de procedimentos preliminares ou de contrato (art. 7º, V) e legítimo interesse na comunicação do serviço (art. 7º, IX).
- **Autenticação de administradores:** nome, e-mail, senha protegida por hash e token de sessão, para controlar o acesso ao painel. Base legal: execução de contrato ou procedimentos preliminares (art. 7º, V) e legítimo interesse na segurança (art. 7º, IX).

Não usamos seus dados para vender produtos, para publicidade de terceiros ou para decisões automatizadas que afetem seus interesses. A análise de solicitações é feita por pessoas, com apoio de verificações automáticas de formato e duplicidade.

## 5. Compartilhamento com operadores

Não vendemos dados pessoais. O compartilhamento ocorre com operadores que prestam serviços essenciais ao funcionamento do guia, sempre limitado ao necessário:

- **Neon (PostgreSQL gerenciado):** hospedagem do banco de dados, com backups e controle de acesso.
- **Vercel:** hospedagem da aplicação, execução das funções de servidor e entrega do site.
- **Cloudflare R2:** armazenamento de imagens, anexos e backups, com bucket privado para cópias de segurança.
- **Resend:** envio de e-mails transacionais, como confirmações, decisões e recuperação de senha.
- **Sentry:** monitoramento de erros e desempenho, quando configurado, com coleta limitada ao necessário para diagnosticar falhas.
- **Upstash Redis:** limitação de tentativas de acesso, quando configurado, para conter abuso e força bruta.

Também podemos compartilhar dados por determinação legal, ordem judicial, requisição de autoridade competente ou para exercer direitos em processo administrativo ou judicial. Nesses casos, informamos o titular quando a lei permitir.

## 6. Transferência internacional de dados

Os operadores podem processar dados fora do Brasil, inclusive nos Estados Unidos e em outras regiões onde mantêm infraestrutura. Quando isso ocorre, buscamos contratos e salvaguardas compatíveis com a LGPD, como cláusulas contratuais de proteção de dados, avaliação de segurança e limitação de acesso. A transferência é necessária para a prestação do serviço e para a segurança da aplicação.

Você pode pedir informações sobre os países e os operadores envolvidos pelo canal do DPO. Alterações relevantes de infraestrutura serão refletidas nesta política.

## 7. Retenção e prazos

Mantemos os dados pelo tempo necessário às finalidades informadas e ao cumprimento de obrigações legais:

- **Solicitações:** enquanto a análise estiver em curso e, depois do estado terminal (aprovada, rejeitada ou encerrada por votação), por até 2 anos, quando então os dados pessoais do solicitante são anonimizados ou eliminados, conforme a regra de retenção do projeto.
- **Fichas publicadas:** enquanto o comércio estiver ativo e a ficha for de interesse público. Após a remoção, os dados deixam de ser exibidos, mas podem permanecer em registros de auditoria e backups pelo prazo legal.
- **Aceites de termos:** enquanto a versão estiver vigente e, depois, pelo prazo necessário à comprovação do aceite e ao exercício regular de direitos.
- **Logs de segurança e auditoria:** em regra, por 6 meses, podendo ser mantidos por mais tempo em caso de investigação de incidente, disputa ou exigência legal.
- **Backups:** por até 30 dias, prazo padrão configurável, ao fim do qual são eliminados.
- **E-mails transacionais:** o conteúdo é mantido pelo provedor pelo tempo necessário à entrega e à comprovação, com minimização de dados.

Terminados os prazos, os dados são eliminados ou anonimizados, salvo quando a conservação for exigida por lei, necessária à defesa em processo ou indispensável ao exercício regular de direitos.

## 8. Direitos do titular

Nos termos do art. 18 da LGPD, você pode exercer, entre outros, os direitos de:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
- portabilidade, quando regulamentada;
- eliminação de dados tratados com consentimento, ressalvadas as hipóteses de conservação;
- informação sobre compartilhamento e sobre a possibilidade de não consentir;
- informação sobre as consequências da negativa;
- revogação do consentimento;
- oposição a tratamento realizado com fundamento em outra base legal, quando houver descumprimento;
- revisão de decisões automatizadas, quando existirem.

Alguns direitos não podem ser atendidos de imediato, como a eliminação de dados cuja conservação é obrigatória ou necessária à defesa de direitos. Nesses casos, explicamos o motivo e o prazo de conservação.

## 9. Como exercer seus direitos

Envie o pedido para dpo@guiabg.com.br, com nome completo, e-mail utilizado no contato e descrição do que deseja. Podemos pedir informação adicional para confirmar sua identidade e evitar que terceiros acessem seus dados. O pedido é registrado e respondido em até 15 dias, salvo hipótese legal que exija prazo diferente ou justifique prorrogação.

Se você não ficar satisfeito com a resposta, pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD) ou buscar os meios legais cabíveis. O GuiaBG colabora com a ANPD e com as autoridades competentes.

## 10. Segurança

Adotamos medidas técnicas e administrativas para proteger os dados, como conexão criptografada (TLS), controle de acesso por perfil, senhas armazenadas com função de hash robusta, tokens de sessão em cookies httpOnly, limitação de tentativas de acesso, registro de auditoria, backups em bucket privado e revisão de permissões.

Nenhum sistema é totalmente imune a falhas, ataques ou erros humanos. Por isso, não prometemos segurança absoluta. Em caso de incidente relevante, adotamos as medidas de contenção, investigação e comunicação previstas na legislação aplicável e no documento de tratamento de dados, informando titulares e ANPD quando cabível.

## 11. Menores de idade

O guia é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de crianças e adolescentes sem base legal e, quando o envio for feito por adolescente entre 16 e 18 anos, recomendamos a participação de responsável. Se identificarmos dados de menor coletados sem autorização adequada, adotamos providências para eliminar ou regularizar o tratamento.

Responsáveis que identificarem dados de menores podem contatar o DPO para solicitar análise e remoção.

## 12. Cookies

Os cookies estritamente necessários mantêm a sessão de administração e protegem o painel; sem eles, o login não funciona. A preferência de tema é guardada localmente e pode ser apagada pelo navegador a qualquer momento. Não usamos cookies de publicidade, de redes sociais ou de rastreamento entre sites.

Você pode bloquear cookies nas configurações do navegador, mas isso pode impedir o login administrativo. O uso do site público continua funcionando sem cookies de tema.

## 13. Alterações desta política

Podemos atualizar esta política para refletir mudanças no tratamento, nos operadores, na legislação ou na infraestrutura. A versão vigente fica publicada nesta página, com data de atualização. Mudanças relevantes podem ser comunicadas no site ou pelos canais de contato.

O histórico de versões fica preservado no banco de dados e pode ser consultado pela administração. Se a alteração afetar direitos, explicamos o impacto e, quando necessário, solicitamos novo consentimento.

## 14. Contato

Para dúvidas, pedidos e reclamações sobre privacidade, escreva para dpo@guiabg.com.br. Para assuntos gerais, contato@guiabg.com.br. A administração do GuiaBG está em Bento Gonçalves, Rio Grande do Sul, e responde em prazo razoável.`;
