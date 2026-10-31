import { Suspense } from "react";
import { SolicitarWizard } from "./_components/solicitar-wizard";

export const metadata = {
  title: "Participar do guia",
  description:
    "Coloque seu comércio ou serviço no GuiaBG. A gente confere e publica. Análise em até 24 h, com resposta por e-mail.",
  robots: { index: true, follow: true },
};

export default function SolicitarPage() {
  return (
    <Suspense fallback={null}>
      <SolicitarWizard />
    </Suspense>
  );
}
