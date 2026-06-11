import { Loader2 } from "lucide-react";

export function RequestOverlay({
  active,
  label = "正在处理请求",
}: {
  active: boolean;
  label?: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <div aria-live="assertive" className="request-overlay" role="status">
      <div className="request-overlay-card">
        <span className="request-overlay-signal" />
        <Loader2 className="spin" size={22} />
        <span>{label}</span>
      </div>
    </div>
  );
}
