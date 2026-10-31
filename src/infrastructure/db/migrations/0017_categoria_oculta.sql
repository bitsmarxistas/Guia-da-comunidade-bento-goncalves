-- 0017: categorias "ocultas" (F4 / pedido de produto).
-- O guia tem ~100 categorias; a home mostra só as principais, mas o catálogo e
-- os filtros continuam com todas. Ocultar é um estado de exibição, não de
-- exclusão — por isso uma coluna booleana, e não desativar a categoria.
ALTER TABLE "categoria" ADD COLUMN IF NOT EXISTS "oculta" boolean DEFAULT false NOT NULL;
