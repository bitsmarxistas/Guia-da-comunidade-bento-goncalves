// src/infrastructure/db/schema/localizacao.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { negocio } from "./negocio";

export const localizacao = pgTable("localizacao", {
  id: uuid("id").primaryKey().defaultRandom(),
  negocioId: uuid("negocio_id")
    .notNull()
    .unique()
    .references(() => negocio.id, { onDelete: "cascade" }),
  endereco: text("endereco"),
  bairro: varchar("bairro", { length: 80 }),
  areaAtendimento: text("area_atendimento"),
  /**
   * Endereço estruturado (2026-10): o CEP vem da consulta de CEP, o número é
   * digitado e "sem ponto comercial" cobre quem atende em casa/na rua ou só
   * por delivery — antes o número era opcional e a ficha ficava sem endereço
   * utilizável no mapa.
   */
  cep: varchar("cep", { length: 9 }),
  numero: varchar("numero", { length: 20 }),
  semPontoComercial: boolean("sem_ponto_comercial").notNull().default(false),
  /** Coordenadas para o mapa (geocodificadas a partir do endereço). */
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  geocodificadoEm: timestamp("geocodificado_em", { withTimezone: true }),
});

export const localizacaoRelations = relations(localizacao, ({ one }) => ({
  negocio: one(negocio, {
    fields: [localizacao.negocioId],
    references: [negocio.id],
  }),
}));

export type Localizacao = typeof localizacao.$inferSelect;
export type NovaLocalizacao = typeof localizacao.$inferInsert;
