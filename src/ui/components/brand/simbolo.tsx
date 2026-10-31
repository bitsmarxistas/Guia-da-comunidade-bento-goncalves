/**
 * Símbolo da marca: pino com fachada sob toldo (§3.4 do guia de frontend).
 * Vetor puro, sem dependência — usado no header, no rodapé e como favicon base.
 */
export function Simbolo({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 40"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {/* corpo do pino */}
      <path
        d="M16 0.9c-8.05 0-14.6 6.4-14.6 14.3 0 10.2 12.2 22.3 13.7 23.7a1.3 1.3 0 0 0 1.8 0c1.5-1.4 13.7-13.5 13.7-23.7C30.6 7.3 24.05 0.9 16 0.9Z"
        fill="currentColor"
      />
      {/* toldo com franjas */}
      <path
        d="M7.4 12.6h17.2l-1.1 4.2a2.6 2.6 0 0 1-2.5 1.9h-.9a2.6 2.6 0 0 1-2.5-1.9l-.1-.4-.1.4a2.6 2.6 0 0 1-2.5 1.9h-.9a2.6 2.6 0 0 1-2.5-1.9L7.4 12.6Z"
        fill="var(--on-brand)"
      />
      {/* fachada: balcão e porta */}
      <rect
        x="10.6"
        y="21.6"
        width="10.8"
        height="6.6"
        rx="1.2"
        fill="var(--on-brand)"
      />
      <rect
        x="14.4"
        y="23.8"
        width="3.2"
        height="4.4"
        rx="0.6"
        fill="currentColor"
      />
    </svg>
  );
}

export function Marca({
  className,
  compacto = false,
}: {
  className?: string;
  compacto?: boolean;
}) {
  return (
    <span
      className={["inline-flex items-center gap-2.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Simbolo className="h-9 w-auto text-brand" />
      <span className="font-[family-name:var(--font-fraunces)] text-[1.35rem] font-semibold tracking-tight text-ink">
        Guia<span className="text-brand">BG</span>
      </span>
      {compacto ? null : <span className="sr-only">GuiaBG</span>}
    </span>
  );
}
