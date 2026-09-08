"use client";

import { useEffect, useId, useRef, useState } from "react";
import { homepageNavigation } from "@/data/homepage-navigation";

const mobileLinks = [{ href: "#quickstart", name: "安装 Roll" }, ...homepageNavigation];

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !hostRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 961px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <div className="mobile-navigation" ref={hostRef}>
      <button
        ref={buttonRef}
        type="button"
        className="mobile-navigation-toggle"
        aria-label="页面导航"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        导航
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d={open ? "M4 4l8 8M12 4l-8 8" : "M3 5h10M3 11h10"} />
        </svg>
      </button>
      <div id={panelId} className="mobile-navigation-panel" hidden={!open}>
        {mobileLinks.map((item) => (
          <a href={item.href} key={item.href} onClick={() => setOpen(false)}>
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
}
