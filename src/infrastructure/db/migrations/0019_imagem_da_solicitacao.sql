-- Foto enviada junto com uma solicitação (inclusão ou chamado de correção).
--
-- Até aqui `imagem.negocio_id` era NOT NULL e o comércio só existe depois da
-- aprovação: o upload público nunca conseguia gravar nada. A coluna passa a
-- aceitar nulo, mas o vínculo continua obrigatório — ou é de um comércio, ou de
-- uma solicitação.
ALTER TABLE "imagem" ALTER COLUMN "negocio_id" DROP NOT NULL;--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'imagem_vinculo_obrigatorio'
  ) THEN
    ALTER TABLE "imagem"
      ADD CONSTRAINT "imagem_vinculo_obrigatorio"
      CHECK ("negocio_id" IS NOT NULL OR "solicitacao_id" IS NOT NULL);
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "imagem_solicitacao_idx" ON "imagem" ("solicitacao_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "imagem_negocio_idx" ON "imagem" ("negocio_id");
