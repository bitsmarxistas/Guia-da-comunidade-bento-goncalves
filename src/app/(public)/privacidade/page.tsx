import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/(public)/_components/documento-legal";

const DESCRICAO =
  "Como o GuiaBG trata dados pessoais conforme a LGPD: coleta, uso, retenção, segurança e como pedir correção ou remoção das suas informações.";

export const metadata: Metadata = {
  title: "Privacidade e dados",
  description: DESCRICAO,
  alternates: { canonical: "/privacidade" },
  openGraph: {
    title: "Privacidade e dados no GuiaBG",
    description: DESCRICAO,
    url: "/privacidade",
    type: "website",
    siteName: "GuiaBG",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacidade e dados no GuiaBG",
    description: DESCRICAO,
  },
};

export default function PrivacidadePage() {
  return (
    <DocumentoLegal
      tipos={["politica_privacidade", "tratamento_dados"]}
      titulo="Privacidade e dados"
      descricao="Como tratamos dados pessoais e como pedir correção ou remoção das suas informações."
    />
  );
}
