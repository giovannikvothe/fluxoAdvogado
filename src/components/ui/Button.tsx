import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({
  className,
  children,
  variant = "primary",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn("btn", `btn-${variant}`, className)}
      disabled={disabled || loading}
      type={props.type ?? "button"}
      {...props}
    >
      {loading ? "Processando..." : children}
    </button>
  );
}

