import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/(public)/_components/documento-legal";

const DESCRICAO =
  "Regras de uso do GuiaBG, o guia comunitário de Bento Gonçalves: participação, publicação de comércios, condutas e responsabilidades.";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: DESCRICAO,
  alternates: { canonical: "/termos" },
  openGraph: {
    title: "Termos de uso do GuiaBG",
    description: DESCRICAO,
    url: "/termos",
    type: "website",
    siteName: "GuiaBG",
    locale: "pt_BR",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Termos de uso do GuiaBG",
    description: DESCRICAO,
  },
};

export default function TermosPage() {
  return (
    <DocumentoLegal
      tipos={["termos_uso"]}
      titulo="Termos de uso"
      descricao="As regras para participar do guia e para o uso das informações publicadas."
    />
  );
}
