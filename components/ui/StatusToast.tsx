import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function StatusToast({
  active,
  message,
  tone = "success",
}: {
  active: boolean;
  message: string;
  tone?: "success" | "error";
}) {
  if (!active) {
    return null;
  }

  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`status-toast ${tone === "success" ? "success" : "error"}`} role="status">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  );
}
