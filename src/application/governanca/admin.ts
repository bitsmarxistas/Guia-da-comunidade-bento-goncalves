// src/application/governanca/admin.ts
"use server";

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { administrador } from "@/infrastructure/db/schema";
import { logSuspensaoAdmin } from "@/infrastructure/db/schema/logs";
import { and, asc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { hashSenha } from "@/infrastructure/auth/hash";
import { appendLog } from "@/infrastructure/audit/audit.service";
import { contextoDaRequisicao, exigirContextoAdmin } from "@/lib/audit-context";
import { ErroDominio } from "@/domain/errors/domain-error";

/**
 * Único e-mail autorizado a gerenciar administradores.
 *
 * A página repete a constante para decidir o que renderizar, mas a checagem
 * que vale é sempre esta, refeita em cada action (a UI não é barreira de
 * segurança).
 */
const ADMIN_RAIZ = "admin@guiabg.com.br";

function mensagemDeValidacao(erro: z.ZodError): string {
  const mensagem = Object.values(erro.flatten().fieldErrors)
    .flat()
    .join(" ")
    .trim();

  return mensagem || "Dados inválidos.";
}

const suspenderAdminSchema = z.object({
  adminId: z.string().uuid(),
  motivo: z.string().min(5).max(500),
  ate: z.string().datetime().optional(), // ISO string, opcional para suspensão indefinida
});

export async function suspenderAdminAction(
  prevState: unknown,
  formData: FormData,
) {
  const admin = await getAdmin();
  if (!admin) return { error: "Não autorizado" };

  // Admin não pode suspender a si mesmo
  const rawData = {
    adminId: formData.get("adminId"),
    motivo: formData.get("motivo"),
    ate: formData.get("ate") || undefined,
  };

  const parseResult = suspenderAdminSchema.safeParse(rawData);
  if (!parseResult.success) {
    const errorMsg = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { error: errorMsg || "Dados inválidos" };
  }

  const { adminId, motivo, ate } = parseResult.data;

  if (adminId === admin.id) {
    return { error: "Não é possível suspender a si mesmo" };
  }

  const adminAlvo = await db.query.administrador.findFirst({
    where: (a, { eq }) => eq(a.id, adminId),
  });

  if (!adminAlvo) {
    return { error: "Admin não encontrado" };
  }

  if (!adminAlvo.ativo) {
    return { error: "Admin já está suspenso" };
  }

  await db.transaction(async (tx) => {
    // Suspender admin
    await tx
      .update(administrador)
      .set({ ativo: false })
      .where(eq(administrador.id, adminId));

    // Log de suspensão
    await tx.insert(logSuspensaoAdmin).values({
      atorTipo: "admin",
      atorId: admin.id,
      adminAlvoId: adminId,
      acao: "suspender",
      motivo,
      ate: ate ? new Date(ate) : null,
    });

    await appendLog(
      {
        ...(await contextoDaRequisicao("admin", admin.id)),
        acao: "suspender_admin",
        entidadeTipo: "administrador",
        entidadeId: adminId,
        detalhes: { motivo, ate: ate ?? null },
        snapshotAntes: { ativo: true },
        snapshotDepois: { ativo: false },
      },
      tx,
    );
  });

  revalidatePath("/admin");

  return { success: true };
}

const reativarAdminSchema = z.object({
  adminId: z.string().uuid(),
  motivo: z.string().min(5).max(500),
});

export async function reativarAdminAction(
  prevState: unknown,
  formData: FormData,
) {
  const admin = await getAdmin();
  if (!admin) return { error: "Não autorizado" };

  const rawData = {
    adminId: formData.get("adminId"),
    motivo: formData.get("motivo"),
  };

  const parseResult = reativarAdminSchema.safeParse(rawData);
  if (!parseResult.success) {
    const errorMsg = Object.values(parseResult.error.flatten().fieldErrors)
      .flat()
      .join(", ");
    return { error: errorMsg || "Dados inválidos" };
  }

  const { adminId, motivo } = parseResult.data;

  const adminAlvo = await db.query.administrador.findFirst({
    where: (a, { eq }) => eq(a.id, adminId),
  });

  if (!adminAlvo) {
    return { error: "Admin não encontrado" };
  }

  if (adminAlvo.ativo) {
    return { error: "Admin já está ativo" };
  }

  await db.transaction(async (tx) => {
    // Reativar admin
    await tx
      .update(administrador)
      .set({ ativo: true })
      .where(eq(administrador.id, adminId));

    // Log de reativação
    await tx.insert(logSuspensaoAdmin).values({
      atorTipo: "admin",
      atorId: admin.id,
      adminAlvoId: adminId,
      acao: "reativar",
      motivo,
    });

    await appendLog(
      {
        ...(await contextoDaRequisicao("admin", admin.id)),
        acao: "reativar_admin",
        entidadeTipo: "administrador",
        entidadeId: adminId,
        detalhes: { motivo },
        snapshotAntes: { ativo: false },
        snapshotDepois: { ativo: true },
      },
      tx,
    );
  });

  revalidatePath("/admin");

  return { success: true };
}

const listarAdminsSchema = z.object({});

export async function listarAdminsAction(
  prevState: unknown,
  formData: FormData,
) {
  const admin = await getAdmin();
  if (!admin) return { error: "Não autorizado" };

  // Listar administradores também é exclusivo do administrador principal:
  // e-mails e situação de contas não podem ser lidos por outros admins.
  if (admin.email.trim().toLowerCase() !== ADMIN_RAIZ) {
    return { error: "Acesso restrito ao administrador principal." };
  }

  const admins = await db.query.administrador.findMany({
    // A action é serializável para o cliente: nunca devolver senhaHash.
    columns: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: (a, { asc }) => [asc(a.nome)],
  });

  return { success: true, admins };
}

const criarAdminSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "O nome deve ter pelo menos 3 caracteres.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Informe um e-mail válido.")
      .max(120, "O e-mail deve ter no máximo 120 caracteres."),
    senha: z
      .string()
      .min(12, "A senha deve ter pelo menos 12 caracteres.")
      .max(200, "A senha deve ter no máximo 200 caracteres."),
    confirmacaoSenha: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacaoSenha, {
    message: "A confirmação da senha não coincide.",
    path: ["confirmacaoSenha"],
  });

/**
 * Cria um administrador ativo com tokenVersion 1.
 *
 * Somente o administrador principal pode chamar. O e-mail é normalizado para
 * minúsculas antes da checagem de duplicidade (o índice único do banco é
 * sensível a caixa).
 */
export async function criarAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const contexto = await exigirContextoAdmin();
  const ator = await getAdmin();

  if (!ator || ator.email.trim().toLowerCase() !== ADMIN_RAIZ) {
    return { error: "Acesso restrito ao administrador principal." };
  }

  const parseResult = criarAdminSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmacaoSenha: formData.get("confirmacaoSenha"),
  });

  if (!parseResult.success) {
    return { error: mensagemDeValidacao(parseResult.error) };
  }

  const { nome, email, senha } = parseResult.data;
  const senhaHash = await hashSenha(senha);

  try {
    await db.transaction(async (tx) => {
      const [existente] = await tx
        .select({ id: administrador.id })
        .from(administrador)
        .where(eq(administrador.email, email))
        .limit(1);

      if (existente) {
        throw new ErroDominio(
          "EMAIL_DUPLICADO",
          "Já existe um administrador com este e-mail.",
        );
      }

      const [novoAdmin] = await tx
        .insert(administrador)
        .values({
          nome,
          email,
          senhaHash,
          ativo: true,
          tokenVersion: 1,
        })
        .returning({ id: administrador.id });

      if (!novoAdmin) {
        throw new ErroDominio(
          "FALHA_CRIAR_ADMIN",
          "Não foi possível criar o administrador.",
        );
      }

      await appendLog(
        {
          ...contexto,
          acao: "criar_admin",
          entidadeTipo: "administrador",
          entidadeId: novoAdmin.id,
          detalhes: { nome, email },
          snapshotDepois: {
            nome,
            email,
            ativo: true,
            tokenVersion: 1,
          },
        },
        tx,
      );
    });
  } catch (erro) {
    if (erro instanceof ErroDominio) {
      return { error: erro.message };
    }
    throw erro;
  }

  revalidatePath("/admin/administradores");

  return { success: true };
}

const atualizarAdminSchema = z.object({
  adminId: z.string().uuid("Administrador inválido."),
  nome: z
    .string()
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(120, "O e-mail deve ter no máximo 120 caracteres."),
  ativo: z.boolean(),
  novaSenha: z
    .string()
    .min(12, "A nova senha deve ter pelo menos 12 caracteres.")
    .max(200, "A nova senha deve ter no máximo 200 caracteres.")
    .optional(),
});

/**
 * Atualiza nome/e-mail/situação de um administrador e, opcionalmente, a senha.
 *
 * Regras de proteção:
 * - somente o administrador principal pode chamar;
 * - o e-mail do administrador principal é imutável (a própria guarda usa ele);
 * - o administrador principal não pode ser desativado;
 * - o último administrador ativo não pode ser desativado;
 * - trocar a senha incrementa tokenVersion, invalidando sessões antigas.
 */
export async function atualizarAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const contexto = await exigirContextoAdmin();
  const ator = await getAdmin();

  if (!ator || ator.email.trim().toLowerCase() !== ADMIN_RAIZ) {
    return { error: "Acesso restrito ao administrador principal." };
  }

  const novaSenhaInformada = formData.get("novaSenha");
  const novaSenha =
    typeof novaSenhaInformada === "string" && novaSenhaInformada.length > 0
      ? novaSenhaInformada
      : undefined;

  const parseResult = atualizarAdminSchema.safeParse({
    adminId: formData.get("adminId"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    ativo: formData.get("ativo") === "on",
    novaSenha,
  });

  if (!parseResult.success) {
    return { error: mensagemDeValidacao(parseResult.error) };
  }

  const {
    adminId,
    nome,
    email,
    ativo,
    novaSenha: senhaNova,
  } = parseResult.data;
  const novaSenhaHash = senhaNova ? await hashSenha(senhaNova) : null;

  try {
    await db.transaction(async (tx) => {
      // Trava todas as contas ativas na mesma ordem em toda atualização. Isso
      // serializa a checagem do "último admin ativo" e evita que duas
      // desativações concorrentes deixem o painel sem ninguém.
      const ativos = await tx
        .select({ id: administrador.id })
        .from(administrador)
        .where(eq(administrador.ativo, true))
        .orderBy(asc(administrador.id))
        .for("update");

      const [alvo] = await tx
        .select({
          id: administrador.id,
          nome: administrador.nome,
          email: administrador.email,
          ativo: administrador.ativo,
          tokenVersion: administrador.tokenVersion,
        })
        .from(administrador)
        .where(eq(administrador.id, adminId))
        .limit(1)
        .for("update");

      if (!alvo) {
        throw new ErroDominio(
          "ADMIN_NAO_ENCONTRADO",
          "Administrador não encontrado.",
        );
      }

      if (alvo.email === ADMIN_RAIZ && email !== ADMIN_RAIZ) {
        throw new ErroDominio(
          "EMAIL_ADMIN_RAIZ_IMUTAVEL",
          "O e-mail do administrador principal não pode ser alterado.",
        );
      }

      if (alvo.ativo && !ativo) {
        if (alvo.email === ADMIN_RAIZ) {
          throw new ErroDominio(
            "ADMIN_RAIZ_INATIVO",
            "O administrador principal não pode ser desativado.",
          );
        }

        if (ativos.length <= 1) {
          throw new ErroDominio(
            "ULTIMO_ADMIN_ATIVO",
            "Não é possível desativar o último administrador ativo.",
          );
        }
      }

      if (email !== alvo.email) {
        const [duplicado] = await tx
          .select({ id: administrador.id })
          .from(administrador)
          .where(
            and(eq(administrador.email, email), ne(administrador.id, adminId)),
          )
          .limit(1);

        if (duplicado) {
          throw new ErroDominio(
            "EMAIL_DUPLICADO",
            "Já existe um administrador com este e-mail.",
          );
        }
      }

      const dadosAtualizacao: {
        nome: string;
        email: string;
        ativo: boolean;
        senhaHash?: string;
        ultimaTrocaSenha?: Date;
        tokenVersion?: number;
      } = { nome, email, ativo };

      if (novaSenhaHash) {
        dadosAtualizacao.senhaHash = novaSenhaHash;
        dadosAtualizacao.ultimaTrocaSenha = new Date();
        // Alvo travado com FOR UPDATE: a leitura + 1 não perde atualização.
        dadosAtualizacao.tokenVersion = alvo.tokenVersion + 1;
      }

      await tx
        .update(administrador)
        .set(dadosAtualizacao)
        .where(eq(administrador.id, adminId));

      await appendLog(
        {
          ...contexto,
          acao: "atualizar_admin",
          entidadeTipo: "administrador",
          entidadeId: adminId,
          detalhes: {
            nome,
            email,
            ativo,
            senhaAlterada: Boolean(novaSenhaHash),
            emailAlterado: email !== alvo.email,
          },
          snapshotAntes: {
            nome: alvo.nome,
            email: alvo.email,
            ativo: alvo.ativo,
            tokenVersion: alvo.tokenVersion,
          },
          snapshotDepois: {
            nome,
            email,
            ativo,
            tokenVersion: novaSenhaHash
              ? alvo.tokenVersion + 1
              : alvo.tokenVersion,
          },
        },
        tx,
      );
    });
  } catch (erro) {
    if (erro instanceof ErroDominio) {
      return { error: erro.message };
    }
    throw erro;
  }

  revalidatePath("/admin/administradores");

  return { success: true };
}
