"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Última fronteira de erro: falhou até o layout raiz.
 *
 * Precisa ser autossuficiente (o CSS do site pode não ter carregado), por isso
 * usa estilos inline e as cores da marca na mão. Antes era a tela branca em
 * inglês do Next ("Application error: a client-side exception has occurred").
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF7F4",
          color: "#1C1618",
          fontFamily:
            "'Source Sans 3', system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#C41E3A",
            }}
          >
            GuiaBG
          </p>
          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "clamp(1.6rem, 4vw, 2.1rem)",
              lineHeight: 1.15,
              fontWeight: 600,
            }}
          >
            O guia encontrou um erro inesperado
          </h1>
          <p style={{ marginTop: "12px", color: "#5B4F52", lineHeight: 1.6 }}>
            Já registramos a falha. Tente recarregar a página; se continuar,
            volte em alguns minutos.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#83787B",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Código do erro: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => (reset ? reset() : window.location.reload())}
              style={{
                minHeight: "44px",
                padding: "0 20px",
                borderRadius: "10px",
                border: "1px solid transparent",
                background: "#C41E3A",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
            {/*
              <a> e não <Link>: o global-error substitui o layout raiz e pode
              rodar sem o roteador montado — o Link depende dele para navegar.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: "44px",
                padding: "0 20px",
                borderRadius: "10px",
                border: "1px solid #D9CFD2",
                background: "#FFFFFF",
                color: "#1C1618",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Ir para o início
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
