import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tab" | "card" | "copy";
  accent?: "orange" | "blue" | "green" | "purple";
  active?: boolean;
};

export function Button({
  children,
  variant = "secondary",
  accent,
  active,
  className = "",
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
    <button className={`${computedClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
