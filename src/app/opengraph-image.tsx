import { ImageResponse } from "next/og";

/**
 * Cartão de compartilhamento (Open Graph) gerado no build da rota.
 * Usa a cor de marca e a tipografia do sistema — sem rede e sem arquivo binário
 * versionado, que envelheceria junto com a identidade.
 */
export const alt = "GuiaBG — comércios e serviços de Bento Gonçalves";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F7F4F4",
        padding: "72px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#C41E3A",
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
        <div style={{ fontSize: 40, fontWeight: 700, color: "#1C1618" }}>
          GuiaBG
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Satori exige "display" explícito em nó com mais de um filho */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            fontSize: 78,
            lineHeight: 1.06,
            color: "#1C1618",
            maxWidth: 980,
          }}
        >
          <span>Consuma de quem</span>{" "}
          <span style={{ color: "#C41E3A", fontStyle: "italic" }}>
            muda a comunidade.
          </span>
        </div>
        <div style={{ fontSize: 32, color: "#574E51" }}>
          Comércios e serviços de Bento Gonçalves.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid #E7E0E2",
          paddingTop: 24,
          fontSize: 26,
          color: "#83787B",
        }}
      >
        <span>guiabg.com.br</span>
        <span>Feito pela comunidade</span>
      </div>
    </div>,
    { ...size },
  );
}
