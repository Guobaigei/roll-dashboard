"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";

type MetalInteraction = {
  over?: boolean;
  focus?: boolean;
  press?: boolean;
  x?: number;
  y?: number;
};

type LiquidMetalLinkProps = {
  href: string;
  children: string;
};

export function LiquidMetalLink({ href, children }: LiquidMetalLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const interactionRef = useRef<MetalInteraction>({ over: false, focus: false, press: false });
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      const shouldRun = visible && !document.hidden && !motion.matches;
      if (!shouldRun) {
        setReady(false);
        interactionRef.current = { over: false, focus: false, press: false };
      }
      setActive(shouldRun);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const receive = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.rollMetal === "ready") {
        setReady(true);
        interactionRef.current = {
          ...interactionRef.current,
          over: window.matchMedia("(hover: hover)").matches && link.matches(":hover"),
          focus: link.matches(":focus-visible"),
        };
        frameRef.current?.contentWindow?.postMessage(
          { rollMetal: "interact", ...interactionRef.current },
          "*",
        );
      } else if (event.data?.rollMetal === "unavailable") {
        setReady(false);
      }
    };
    observer.observe(link);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    window.addEventListener("message", receive);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      window.removeEventListener("message", receive);
    };
  }, []);

  const send = (interaction: MetalInteraction) => {
    interactionRef.current = { ...interactionRef.current, ...interaction };
    frameRef.current?.contentWindow?.postMessage(
      { rollMetal: "interact", ...interactionRef.current },
      "*",
    );
  };

  const pointerPosition = (event: PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - rect.width / 2) / rect.height,
      y: (event.clientY - rect.top - rect.height / 2) / rect.height,
    };
  };

  return (
    <a
      ref={linkRef}
      href={href}
      className="liquid-metal-link"
      data-metal={active && ready ? "ready" : "fallback"}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") send({ over: true, ...pointerPosition(event) });
      }}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") send({ over: true, ...pointerPosition(event) });
      }}
      onPointerLeave={() => send({ over: false, press: false })}
      onPointerDown={(event) => send({ press: true, ...pointerPosition(event) })}
      onPointerUp={() => send({ press: false })}
      onPointerCancel={() => send({ press: false, over: false })}
      onFocus={(event) => send({ focus: event.currentTarget.matches(":focus-visible") })}
      onBlur={() => send({ focus: false, press: false })}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.repeat) send({ press: true, x: 0, y: 0 });
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter") send({ press: false });
      }}
    >
      {active && (
        <iframe
          ref={frameRef}
          src="/visual/liquid-metal.html"
          title="液态金属装饰"
          sandbox="allow-scripts"
          tabIndex={-1}
          aria-hidden="true"
          className="liquid-metal-surface"
        />
      )}
      <span className="liquid-metal-label">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3v10m-4-4 4 4 4-4M4 14v3h12v-3" />
        </svg>
        {children}
      </span>
    </a>
  );
}
