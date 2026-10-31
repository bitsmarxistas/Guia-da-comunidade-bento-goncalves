// src/app/(admin)/_components/admin-shared.tsx
import { Badge } from "@/ui/components/badge";
import { cn } from "@/lib/utils";

export const SITUACOES = [
  { value: "nao_elegivel", label: "Não elegível" },
  { value: "publicado", label: "Publicado" },
  { value: "rascunho", label: "Rascunho" },
  { value: "expirado", label: "Expirado" },
] as const;

const SITUACAO_CLASSES: Record<string, string> = {
  publicado: "border-positive/30 bg-positive-tint text-positive",
  rascunho: "border-line bg-surface-2 text-ink-soft",
  nao_elegivel: "border-warning/30 bg-warning-tint text-warning",
  expirado: "border-critical/30 bg-critical-tint text-critical",
};

const SITUACAO_LABELS: Record<string, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  nao_elegivel: "Não elegível",
  expirado: "Expirado",
};

export function SituacaoBadge({ situacao }: { situacao: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        SITUACAO_CLASSES[situacao] ?? "border-line bg-surface-2 text-ink-soft",
      )}
    >
      {SITUACAO_LABELS[situacao] || situacao}
    </Badge>
  );
}

export function RestritoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 border-line-strong bg-surface-2 px-2 text-[0.625rem] font-semibold tracking-[0.1em] text-ink-soft uppercase",
        className,
      )}
    >
      restrito
    </Badge>
  );
}

export function AdminPageHeader({
  title,
  description,
  restrito = false,
  children,
}: {
  title: string;
  description?: string;
  restrito?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0 space-y-1.5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
          Admin
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {restrito ? <RestritoBadge /> : null}
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
