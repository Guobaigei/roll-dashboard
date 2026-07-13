import type { ButtonHTMLAttributes } from "react";
import type { Accent } from "@/lib/ui/accent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tab" | "card" | "copy";
  accent?: Accent;
  active?: boolean;
};

export function Button({
  children,
  variant = "secondary",
  accent,
  active,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  let computedClass = `ui-btn btn-${variant}`;

  if (accent) {
    computedClass += ` accent-${accent}`;
  }

  if (active) {
    computedClass += " active";
  }

  return (
    <button type={type} className={`${computedClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
