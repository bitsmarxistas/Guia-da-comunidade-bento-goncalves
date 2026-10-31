// src/scripts/geocodificar-enderecos.ts
//
// Preenche latitude/longitude das fichas publicadas que ainda não têm mapa.
//
// A ficha mostra o mapa quando há coordenadas; sem elas o visitante vê o
// endereço e os links de rota. Este script busca as coordenadas uma única vez
// (BrasilAPI pelo CEP, Nominatim pelo endereço) e grava na linha, então o mapa
// passa a renderizar sem depender de serviço externo a cada visita.
//
// Uso: pnpm db:geocodificar [--limite 50] [--dry-run]
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { localizacao, negocio } from "@/infrastructure/db/schema";

const LIMITE = Number(
  process.argv.find((a) => a.startsWith("--limite="))?.split("=")[1] ?? 50,
);
const DRY_RUN = process.argv.includes("--dry-run");

interface Coordenadas {
  latitude: number;
  longitude: number;
}

async function porCep(cep: string): Promise<Coordenadas | null> {
  try {
    const resposta = await fetch(
      `https://brasilapi.com.br/api/cep/v2/${cep.replace(/\D/g, "")}`,
      {
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as {
      location?: { coordinates?: { latitude?: string; longitude?: string } };
    };
    const latitude = Number(dados.location?.coordinates?.latitude);
    const longitude = Number(dados.location?.coordinates?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  } catch {
    return null;
  }
}

async function porEndereco(texto: string): Promise<Coordenadas | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", texto);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    const resposta = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        // Nominatim exige identificação do cliente.
        "User-Agent":
          "GuiaBG/1.0 (https://guiabg.com.br; contato@guiabg.com.br)",
        "Accept-Language": "pt-BR",
      },
    });
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const primeiro = dados[0];
    if (!primeiro?.lat || !primeiro?.lon) return null;
    const latitude = Number(primeiro.lat);
    const longitude = Number(primeiro.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  } catch {
    return null;
  }
}

async function main() {
  const pendencias = await db
    .select({
      localizacaoId: localizacao.id,
      endereco: localizacao.endereco,
      bairro: localizacao.bairro,
      cep: localizacao.cep,
      nome: negocio.nome,
    })
    .from(localizacao)
    .innerJoin(negocio, eq(negocio.id, localizacao.negocioId))
    .where(
      and(
        eq(negocio.situacaoPublicacao, "publicado"),
        isNull(localizacao.latitude),
        or(isNull(localizacao.geocodificadoEm), undefined),
      ),
    )
    .limit(LIMITE);

  console.log(
    `📍 Geocodificando ${pendencias.length} ficha(s)${DRY_RUN ? " (dry-run)" : ""}`,
  );

  let ok = 0;
  let semEndereco = 0;
  let falhou = 0;

  for (const linha of pendencias) {
    const texto = [linha.endereco, linha.bairro, "Bento Gonçalves, RS, Brasil"]
      .filter(Boolean)
      .join(", ");

    if (!linha.endereco && !linha.cep) {
      semEndereco++;
      continue;
    }

    const coords =
      (linha.cep ? await porCep(linha.cep) : null) ??
      (linha.endereco ? await porEndereco(texto) : null);

    if (!coords) {
      falhou++;
      console.log(`  ✗ ${linha.nome}: sem coordenadas para "${texto}"`);
      // Marca a tentativa para não repetir a cada execução.
      if (!DRY_RUN) {
        await db
          .update(localizacao)
          .set({ geocodificadoEm: new Date() })
          .where(eq(localizacao.id, linha.localizacaoId));
      }
      continue;
    }

    ok++;
    console.log(
      `  ✓ ${linha.nome}: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
    );

    if (!DRY_RUN) {
      await db
        .update(localizacao)
        .set({
          latitude: coords.latitude,
          longitude: coords.longitude,
          geocodificadoEm: new Date(),
        })
        .where(eq(localizacao.id, linha.localizacaoId));
    }

    // Nominatim pede no máximo 1 requisição por segundo.
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(
    `\nResumo: ${ok} geocodificada(s), ${semEndereco} sem endereço, ${falhou} sem coordenada.`,
  );
  process.exit(0);
}

main().catch((erro) => {
  console.error("falha ao geocodificar:", erro);
  process.exit(1);
});
