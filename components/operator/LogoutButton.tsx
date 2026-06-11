"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <RequestOverlay active={loading} label="正在退出登录" />
      <button className="operator-logout-btn" disabled={loading} onClick={logout} type="button">
        <LogOut size={16} />
        {loading ? "退出中" : "退出"}
      </button>
    </>
  );
}
