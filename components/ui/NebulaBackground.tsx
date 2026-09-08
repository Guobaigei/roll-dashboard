"use client";

import { useEffect, useRef } from "react";
import { createNebulaRenderer } from "@/lib/visual/nebula-renderer";

export function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return createNebulaRenderer(canvas);
  }, []);

  return (
    <div className="nebula-background" aria-hidden="true">
      <canvas ref={canvasRef} className="nebula-canvas" />
    </div>
  );
}
