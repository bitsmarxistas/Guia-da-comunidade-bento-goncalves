// src/infrastructure/db/schema/imagem.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocio } from "./negocio";
import { solicitacao } from "./solicitacao";
import { anexo } from "./anexo";

export const imagem = pgTable("imagem", {
  id: uuid("id").primaryKey().defaultRandom(),
  /*
   * O vínculo é com o comércio OU com a solicitação — nunca os dois vazios.
   *
   * Antes a coluna era NOT NULL: uma foto enviada junto com o pedido de
   * inclusão não tinha como ser gravada, porque o comércio só nasce na
   * aprovação. Resultado: o upload do wizard era descartado e a fila de
   * moderação ficava sempre vazia. Agora a foto nasce presa à solicitação e
   * ganha o comércio quando a equipe aprova.
   */
  negocioId: uuid("negocio_id").references(() => negocio.id),
  solicitacaoId: uuid("solicitacao_id").references(() => solicitacao.id),
  anexoOrigemId: uuid("anexo_origem_id").references(() => anexo.id),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'logo' | 'foto'
  situacao: varchar("situacao", { length: 20 }).notNull().default("pendente"), // 'pendente' | 'aprovada' | 'rejeitada'
  url: text("url").notNull(),
  justificativaRejeicao: text("justificativa_rejeicao"),
  criadoEm: timestamp("criada_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const imagemRelations = relations(imagem, ({ one }) => ({
  negocio: one(negocio, {
    fields: [imagem.negocioId],
    references: [negocio.id],
  }),
  solicitacao: one(solicitacao, {
    fields: [imagem.solicitacaoId],
    references: [solicitacao.id],
  }),
  anexoOrigem: one(anexo, {
    fields: [imagem.anexoOrigemId],
    references: [anexo.id],
  }),
}));

export type Imagem = typeof imagem.$inferSelect;
export type NovaImagem = typeof imagem.$inferInsert;
