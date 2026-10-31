// src/infrastructure/email/participacao.ts
"use server";

import { db } from "@/infrastructure/db/client";
import { administrador } from "@/infrastructure/db/schema";
import { logComunicacao } from "@/infrastructure/db/schema/logs";
import { eq } from "drizzle-orm";
import { enviarEmail } from "./client";
import {
  gerarEmailNovaSolicitacaoEquipe,
  gerarEmailSolicitacaoRecebida,
} from "./templates-participacao";

interface DadosSolicitacao {
  emailSolicitante: string;
  nomeSolicitante: string;
  nomeNegocio: string;
  protocolo: string;
  tipo: "inclusao" | "atualizacao";
  alteracoes?: Array<{ rotulo: string; de: string; para: string }>;
}

/**
 * Confirmação para quem enviou a solicitação.
 *
 * O resultado real do envio fica em log_comunicacao: e-mail que falhou não
 * pode aparecer como enviado, nem sumir sem rastro.
 */
async function confirmarParaSolicitante(dados: DadosSolicitacao) {
  const { html, text } = gerarEmailSolicitacaoRecebida({
    nomeSolicitante: dados.nomeSolicitante,
    nomeNegocio: dados.nomeNegocio,
    protocolo: dados.protocolo,
    tipo: dados.tipo,
  });

  const envio = await enviarEmail({
    to: dados.emailSolicitante,
    subject: `Recebemos sua solicitação — protocolo ${dados.protocolo}`,
    html,
    text,
  });

  await db.insert(logComunicacao).values({
    atorTipo: "sistema",
    tipo: "solicitacao_recebida",
    destinatario: dados.emailSolicitante,
    sucesso: envio.success,
    erro: envio.error ?? null,
  });

  return envio;
}

/** Aviso para cada administrador ativo de que entrou solicitação nova. */
async function avisarEquipe(dados: DadosSolicitacao) {
  const admins = await db.query.administrador.findMany({
    where: eq(administrador.ativo, true),
    columns: { email: true },
  });

  if (admins.length === 0) return;

  const { html, text } = gerarEmailNovaSolicitacaoEquipe({
    nomeSolicitante: dados.nomeSolicitante,
    emailSolicitante: dados.emailSolicitante,
    nomeNegocio: dados.nomeNegocio,
    protocolo: dados.protocolo,
    tipo: dados.tipo,
    alteracoes: dados.alteracoes,
  });

  for (const admin of admins) {
    const envio = await enviarEmail({
      to: admin.email,
      subject: `Nova ${dados.tipo === "atualizacao" ? "correção" : "inclusão"}: ${dados.nomeNegocio} (${dados.protocolo})`,
      html,
      text,
    });

    await db.insert(logComunicacao).values({
      atorTipo: "sistema",
      tipo: "nova_solicitacao_equipe",
      destinatario: admin.email,
      sucesso: envio.success,
      erro: envio.error ?? null,
    });
  }
}

/**
 * Dispara os e-mails do envio de solicitação.
 *
 * Nunca deixa o envio de e-mail derrubar a solicitação já gravada: falha aqui
 * vira linha em log_comunicacao, não erro para o solicitante.
 */
export async function notificarSolicitacaoRecebida(dados: DadosSolicitacao) {
  try {
    await confirmarParaSolicitante(dados);
  } catch (erro) {
    console.error("[E-mail] falha ao confirmar solicitação:", erro);
  }

  try {
    await avisarEquipe(dados);
  } catch (erro) {
    console.error("[E-mail] falha ao avisar a equipe:", erro);
  }
}
