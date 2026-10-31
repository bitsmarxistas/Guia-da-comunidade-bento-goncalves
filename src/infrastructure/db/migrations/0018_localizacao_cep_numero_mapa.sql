-- 0018: endereço estruturado + coordenadas do mapa (pedido de produto).
-- O CEP alimenta o preenchimento automático e o número passa a ser obrigatório
-- (ou marcado "sem ponto comercial"). As coordenadas são geocodificadas uma vez
-- e guardadas na linha para o mapa da ficha não depender de serviço externo.
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "cep" varchar(9);--> statement-breakpoint
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "numero" varchar(20);--> statement-breakpoint
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "sem_ponto_comercial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "latitude" double precision;--> statement-breakpoint
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "longitude" double precision;--> statement-breakpoint
ALTER TABLE "localizacao" ADD COLUMN IF NOT EXISTS "geocodificado_em" timestamp with time zone;
