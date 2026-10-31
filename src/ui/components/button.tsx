import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * Botões do design system aprovado.
 * Alvo mínimo de 44 px nos tamanhos de uso público (WCAG 2.2 / §4 do guia).
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors duration-200 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-on-brand hover:bg-brand-strong active:bg-brand-strong",
        outline:
          "border-line-strong bg-surface text-ink hover:bg-surface-2 active:bg-surface-2",
        secondary:
          "bg-surface-2 text-ink hover:bg-[color-mix(in_srgb,var(--surface-2),var(--ink)_6%)]",
        ghost: "text-ink hover:bg-surface-2 active:bg-surface-2",
        destructive:
          "border-critical bg-transparent text-critical hover:bg-critical-tint",
        link: "text-brand underline-offset-4 hover:text-brand-strong hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-[0.8125rem]",
        lg: "h-12 px-6 text-base",
        xs: "h-8 px-2.5 text-xs",
        icon: "size-11",
        "icon-sm": "size-9 rounded-[8px]",
        "icon-lg": "size-12",
        "icon-xs": "size-8 rounded-[8px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
