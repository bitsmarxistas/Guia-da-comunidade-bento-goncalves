// src/application/auditoria/listar.ts
"use server";

import { db } from "@/infrastructure/db/client";
import { logAuditoria } from "@/infrastructure/db/schema/logs";
import { desc, eq, and, sql, type SQL } from "drizzle-orm";
import { exigirContextoAdmin } from "@/lib/audit-context";

const POR_PAGINA = 30;

/**
 * Trilha de auditoria (RF-062).
 *
 * O log_auditoria já era gravado em toda ação sensível, mas não havia tela
 * para consultá-lo: a auditoria existia no banco e ninguém conseguia ler.
 */
export async function listarAuditoriaAction(
  _prev: unknown,
  formData: FormData,
) {
  await exigirContextoAdmin();

  const acao = ((formData.get("acao") as string) ?? "").trim() || undefined;
  const atorTipo =
    ((formData.get("atorTipo") as string) ?? "").trim() || undefined;
  const pagina = Math.max(1, Number(formData.get("pagina") ?? 1) || 1);

  const condicoes: SQL[] = [];
  if (acao) condicoes.push(sql`${logAuditoria.acao} = ${acao}`);
  if (atorTipo) condicoes.push(eq(logAuditoria.atorTipo, atorTipo));
  const where = condicoes.length > 0 ? and(...condicoes) : undefined;

  const [registros, total, acoes] = await Promise.all([
    db
      .select()
      .from(logAuditoria)
      .where(where)
      .orderBy(desc(logAuditoria.criadoEm))
      .limit(POR_PAGINA)
      .offset((pagina - 1) * POR_PAGINA),
    db.$count(logAuditoria, where),
    db
      .select({ acao: logAuditoria.acao })
      .from(logAuditoria)
      .groupBy(logAuditoria.acao)
      .orderBy(logAuditoria.acao),
  ]);

  return {
    registros,
    total: Number(total ?? 0),
    pagina,
    totalPaginas: Math.max(1, Math.ceil(Number(total ?? 0) / POR_PAGINA)),
    acoes: acoes.map((linha) => linha.acao),
  };
}
