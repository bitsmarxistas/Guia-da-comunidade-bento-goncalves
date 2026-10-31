import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/(public)/_components/documento-legal";

export const metadata: Metadata = {
  title: "Privacidade e dados",
  description:
    "Como o GuiaBG trata dados pessoais, conforme a LGPD, e como pedir correção ou remoção.",
  alternates: { canonical: "/privacidade" },
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
