import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  dot?: boolean;
  accent?: "orange" | "blue" | "green" | "purple";
  children: ReactNode;
  className?: string;
};

export function Card({ title, dot = true, accent, children, className = "" }: CardProps) {
  let computedClass = "ui-card";
  if (accent) {
    computedClass += ` accent-${accent}`;
  }

  return (
    <div className={`${computedClass} ${className}`}>
      {title || dot ? (
        <div className="panel-chrome">
          {dot && <span className="panel-dot" />}
          {title && <span className="panel-title">{title}</span>}
        </div>
      ) : null}
      <div className="ui-card-body">{children}</div>
    </div>
  );
}
