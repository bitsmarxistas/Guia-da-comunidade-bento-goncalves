import { Suspense } from "react";
import type { Metadata } from "next";
import { SolicitarWizard } from "./_components/solicitar-wizard";

const DESCRICAO =
  "Coloque seu comércio ou serviço no GuiaBG. A gente confere e publica. Análise em até 24 h, com resposta por e-mail e sem burocracia.";

export const metadata: Metadata = {
  title: "Cadastre seu comércio em Bento Gonçalves",
  description: DESCRICAO,
  alternates: { canonical: "/solicitar" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Cadastre seu comércio no GuiaBG",
    description: DESCRICAO,
    url: "/solicitar",
    type: "website",
    siteName: "GuiaBG",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadastre seu comércio no GuiaBG",
    description: DESCRICAO,
  },
};

export default function SolicitarPage() {
  return (
    <Suspense fallback={null}>
      <SolicitarWizard />
    </Suspense>
  );
}
