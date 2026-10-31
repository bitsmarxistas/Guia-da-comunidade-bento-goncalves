// src/infrastructure/email/templates-participacao.ts
//
// E-mails do fluxo de participação (2026-10).
//
// Antes, quem enviava uma solicitação não recebia nada: o único e-mail do
// fluxo era o da ANÁLISE, disparado só quando um admin decidia. A pessoa
// preenchia o formulário, lia "a resposta chega por e-mail" e ficava sem
// nenhum sinal de que o pedido existia. Agora sai a confirmação na hora (com
// protocolo) e a equipe recebe o aviso da nova solicitação.

const MARCA = "#C41E3A";
const MARCA_FUNDO = "#FBE6EA";

/** Moldura comum: mesmas cores do site, tabela simples (funciona em qualquer cliente). */
function moldura({
  titulo,
  corpo,
  rodape,
}: {
  titulo: string;
  corpo: string;
  rodape?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titulo} — GuiaBG</title>
</head>
<body style="margin:0;padding:24px;background:#F7F4F4;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1C1618;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E8E1E2;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:20px 28px;border-bottom:1px solid #E8E1E2;">
        <span style="font-size:20px;font-weight:700;">Guia<span style="color:${MARCA}">BG</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        ${corpo}
        ${rodape ? `<hr style="border:none;border-top:1px solid #E8E1E2;margin:24px 0;"><p style="margin:0;font-size:13px;color:#6B5F62;">${rodape}</p>` : ""}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:${MARCA_FUNDO};font-size:12px;color:#6B5F62;">
        GuiaBG — guia comunitário de comércios e serviços de Bento Gonçalves.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function gerarEmailSolicitacaoRecebida({
  nomeSolicitante,
  nomeNegocio,
  protocolo,
  tipo,
}: {
  nomeSolicitante: string;
  nomeNegocio: string;
  protocolo: string;
  tipo: "inclusao" | "atualizacao";
}): { html: string; text: string } {
  const oQueFoi =
    tipo === "atualizacao"
      ? "o pedido de correção da ficha"
      : "o pedido de inclusão do comércio";

  const html = moldura({
    titulo: "Recebemos sua solicitação",
    corpo: `
      <h1 style="margin:0 0 16px;font-size:22px;">Recebemos sua solicitação</h1>
      <p style="margin:0 0 12px;">Olá, <strong>${nomeSolicitante}</strong>.</p>
      <p style="margin:0 0 16px;">Registramos ${oQueFoi} <strong>${nomeNegocio}</strong>.</p>
      <p style="margin:0 0 4px;font-size:13px;color:#6B5F62;">Protocolo</p>
      <p style="margin:0 0 20px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:20px;font-weight:700;letter-spacing:0.06em;">${protocolo}</p>
      <p style="margin:0 0 12px;">A equipe confere as informações e responde <strong>neste e-mail</strong> em até 24 horas úteis. Guarde o protocolo para falar com a gente.</p>
      <p style="margin:0;">${
        tipo === "atualizacao"
          ? "A ficha continua no ar como está até a correção ser aprovada."
          : "O comércio só aparece no guia depois da aprovação."
      }</p>`,
    rodape:
      "Você recebeu este e-mail porque enviou uma solicitação no guiabg.com.br.",
  });

  const text = [
    "Recebemos sua solicitação — GuiaBG",
    "",
    `Olá, ${nomeSolicitante}.`,
    `Registramos ${oQueFoi} ${nomeNegocio}.`,
    "",
    `Protocolo: ${protocolo}`,
    "",
    "A equipe confere as informações e responde neste e-mail em até 24 horas úteis.",
    tipo === "atualizacao"
      ? "A ficha continua no ar como está até a correção ser aprovada."
      : "O comércio só aparece no guia depois da aprovação.",
    "",
    "--",
    "GuiaBG — guia comunitário de Bento Gonçalves",
  ].join("\n");

  return { html, text };
}

export function gerarEmailNovaSolicitacaoEquipe({
  nomeSolicitante,
  emailSolicitante,
  nomeNegocio,
  protocolo,
  tipo,
  alteracoes,
}: {
  nomeSolicitante: string;
  emailSolicitante: string;
  nomeNegocio: string;
  protocolo: string;
  tipo: "inclusao" | "atualizacao";
  alteracoes?: Array<{ rotulo: string; de: string; para: string }>;
}): { html: string; text: string } {
  const linhas = (alteracoes ?? [])
    .map(
      (a) =>
        `<tr><td style="padding:6px 8px;border-top:1px solid #E8E1E2;font-weight:600;">${a.rotulo}</td><td style="padding:6px 8px;border-top:1px solid #E8E1E2;color:#6B5F62;text-decoration:line-through;">${a.de || "—"}</td><td style="padding:6px 8px;border-top:1px solid #E8E1E2;">${a.para || "—"}</td></tr>`,
    )
    .join("");

  const rotuloTipo =
    tipo === "atualizacao" ? "chamado de correção" : "inclusão";

  const html = moldura({
    titulo: "Nova solicitação no painel",
    corpo: `
      <h1 style="margin:0 0 16px;font-size:22px;">Nova solicitação no painel</h1>
      <p style="margin:0 0 4px;"><strong>${nomeNegocio}</strong></p>
      <p style="margin:0 0 16px;font-size:13px;color:#6B5F62;">Protocolo ${protocolo} · ${rotuloTipo}</p>
      <p style="margin:0 0 16px;">Solicitante: ${nomeSolicitante} &lt;${emailSolicitante}&gt;</p>
      ${
        linhas
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-collapse:collapse;">
               <tr><th align="left" style="padding:6px 8px;font-size:12px;color:#6B5F62;">Campo</th><th align="left" style="padding:6px 8px;font-size:12px;color:#6B5F62;">Publicado</th><th align="left" style="padding:6px 8px;font-size:12px;color:#6B5F62;">Pedido</th></tr>
               ${linhas}
             </table>`
          : ""
      }
      <p style="margin:20px 0 0;"><a href="https://guiabg.com.br/admin/solicitacoes" style="display:inline-block;background:${MARCA};color:#FFFFFF;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">Abrir no painel</a></p>`,
    rodape: "Aviso automático para a administração do GuiaBG.",
  });

  const text = [
    "Nova solicitação no painel — GuiaBG",
    "",
    nomeNegocio,
    `Protocolo ${protocolo} · ${rotuloTipo}`,
    `Solicitante: ${nomeSolicitante} <${emailSolicitante}>`,
    "",
    ...(alteracoes ?? []).map(
      (a) => `${a.rotulo}: ${a.de || "—"} => ${a.para || "—"}`,
    ),
    "",
    "https://guiabg.com.br/admin/solicitacoes",
  ].join("\n");

  return { html, text };
}
