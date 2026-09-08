"use client";

import { useEffect, useRef } from "react";

// CSS adaptation of the breathing dot-field treatment in ThreeUI Dot Matrix:
// https://threeui.com/three-js/structure-flow/dot-matrix
export function PanelDotBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      host.dataset.running = String(visible && !document.hidden && !motion.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(host);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      host.dataset.running = "false";
    };
  }, []);

  return (
    <div ref={hostRef} className="cli-panel-ambient" data-running="false" aria-hidden="true">
      <span className="cli-panel-dots" />
      <span className="cli-panel-glow" />
    </div>
  );
}
