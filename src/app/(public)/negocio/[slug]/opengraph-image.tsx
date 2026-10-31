import { ImageResponse } from "next/og";
import { buscarNegocioPorSlug } from "@/application/negocios/listar";

export const runtime = "nodejs";
export const revalidate = 60;

export const alt = "GuiaBG — comércio e serviço de Bento Gonçalves";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FUNDO = "#F7F4F4";
const MARCA = "#C41E3A";
const TINTA = "#1C1618";
const TINTA_SUAVE = "#574E51";
const LINHA = "#E7E0E2";

function limitarTexto(texto: string, limite: number): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;

  const corte = limpo.slice(0, limite - 1);
  const ultimoEspaco = corte.lastIndexOf(" ");
  const base =
    ultimoEspaco >= Math.floor(limite * 0.6)
      ? corte.slice(0, ultimoEspaco)
      : corte;

  return `${base.trimEnd()}…`;
}

/**
 * Cartão social por comércio: nome, categoria e bairro sobre o fundo claro da
 * marca, com o detalhe vermelho do guia. Satori exige "display: flex" em todo
 * nó com mais de um filho e o texto precisa ficar em um nó único.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const negocio = await buscarNegocioPorSlug(slug).catch(() => null);

  const nome = limitarTexto(negocio?.nome ?? "GuiaBG", 48);
  const categoria = limitarTexto(
    negocio?.categorias[0]?.categoria?.nome ?? "Comércio e serviço local",
    24,
  );
  const bairro = limitarTexto(
    negocio?.localizacao?.bairro ?? "Bento Gonçalves",
    26,
  );
  const descricao = limitarTexto(
    negocio?.descricao ??
      "Comércios e serviços de Bento Gonçalves, feitos pela comunidade.",
    110,
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: FUNDO,
        padding: "64px 72px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: MARCA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            G
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 700,
              color: TINTA,
            }}
          >
            GuiaBG
          </div>
        </div>

        <div
          style={{
            display: "flex",
            height: 8,
            width: 120,
            borderRadius: 999,
            background: MARCA,
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
            color: TINTA,
            maxWidth: 1020,
          }}
        >
          {nome}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              background: MARCA,
              color: "#FFFFFF",
              padding: "8px 22px",
              fontSize: 26,
              fontWeight: 600,
              maxWidth: 620,
            }}
          >
            {categoria}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: TINTA_SUAVE,
              maxWidth: 300,
            }}
          >
            {bairro}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            lineHeight: 1.35,
            color: TINTA_SUAVE,
            maxWidth: 1000,
          }}
        >
          {descricao}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          borderTop: `2px solid ${LINHA}`,
          paddingTop: 24,
          fontSize: 24,
          color: "#83787B",
        }}
      >
        <div style={{ display: "flex" }}>guiabg.com.br</div>
        <div style={{ display: "flex" }}>Feito pela comunidade</div>
      </div>
    </div>,
    { ...size },
  );
}
