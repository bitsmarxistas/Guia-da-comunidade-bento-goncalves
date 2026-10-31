import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/(public)/_components/documento-legal";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso do GuiaBG, o guia comunitário de Bento Gonçalves.",
  alternates: { canonical: "/termos" },
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
