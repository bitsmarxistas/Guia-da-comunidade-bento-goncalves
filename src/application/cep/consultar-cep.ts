// src/application/cep/consultar-cep.ts
"use server";

import { formatarCep, normalizarCep } from "@/domain/utils/cep";

export interface EnderecoDoCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ResultadoCep {
  endereco?: EnderecoDoCep;
  error?: string;
}

/**
 * Consulta de CEP com preenchimento automático do endereço.
 *
 * BrasilAPI primeiro (devolve coordenadas quando o CEP tem geolocalização no
 * ViaCEP); ViaCEP como reserva (só o endereço). O CEP do guia é de Bento
 * Gonçalves, então a resposta é conferida contra a cidade para não preencher
 * um endereço de outro estado por erro de digitação.
 */
export async function consultarCepAction(valor: string): Promise<ResultadoCep> {
  const cep = normalizarCep(valor);

  if (cep.length !== 8) {
    return { error: "O CEP precisa ter 8 dígitos." };
  }
  if (/^0{8}$/.test(cep)) {
    return { error: "Informe um CEP válido." };
  }

  try {
    const resposta = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (resposta.ok) {
      const dados = (await resposta.json()) as {
        cep?: string;
        street?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        location?: { coordinates?: { longitude?: string; latitude?: string } };
      };

      const latitude = Number(dados.location?.coordinates?.latitude);
      const longitude = Number(dados.location?.coordinates?.longitude);

      return {
        endereco: {
          cep: formatarCep(dados.cep ?? cep),
          logradouro: dados.street ?? "",
          bairro: dados.neighborhood ?? "",
          cidade: dados.city ?? "",
          uf: dados.state ?? "",
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
        },
      };
    }
  } catch {
    // rede instável: cai para o ViaCEP
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (resposta.ok) {
      const dados = (await resposta.json()) as {
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean;
      };

      if (!dados.erro) {
        return {
          endereco: {
            cep: formatarCep(dados.cep ?? cep),
            logradouro: dados.logradouro ?? "",
            bairro: dados.bairro ?? "",
            cidade: dados.localidade ?? "",
            uf: dados.uf ?? "",
            latitude: null,
            longitude: null,
          },
        };
      }
    }
  } catch {
    // sem rede para os dois provedores
  }

  return {
    error: "Não encontramos esse CEP agora. Preencha o endereço à mão.",
  };
}
