"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useClipboardFeedback(timeoutMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, key: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      setCopiedKey(key);
      resetTimerRef.current = setTimeout(() => setCopiedKey(null), timeoutMs);

      return true;
    },
    [timeoutMs],
  );

  return { copiedKey, copy };
}
