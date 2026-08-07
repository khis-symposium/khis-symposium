"use client";

import { useEffect, useRef } from "react";
import { ShaderBackground } from "./blue-noise";

/**
 * Hero background stack: a real event photo sits behind the generative
 * shader. The shader is drawn with mix-blend-screen so its dark navy areas
 * let the (very dim) photo bleed through, while the bright noise lines stay
 * on top — and the photo itself is only revealed within a soft spotlight
 * mask that follows the pointer, so it reads as "faintly visible as the
 * mouse moves" rather than a static background image.
 */
export function HeroBackdrop({ photoSrc }: { photoSrc: string }) {
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Skip pointer-tracking entirely; a fixed, very faint reveal is enough.
      el.style.opacity = "0.05";
      return;
    }

    let raf = 0;
    let fadeTimeout = 0;

    function updatePosition(clientX: number, clientY: number) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
      el.style.opacity = "0.16";

      window.clearTimeout(fadeTimeout);
      fadeTimeout = window.setTimeout(() => {
        if (el) el.style.opacity = "0.04";
      }, 900);
    }

    function onPointerMove(e: PointerEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updatePosition(e.clientX, e.clientY);
      });
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <>
      <div
        ref={photoRef}
        className="absolute inset-0 bg-cover bg-center opacity-[0.04] transition-opacity duration-700 ease-out"
        style={{
          backgroundImage: `url(${photoSrc})`,
          maskImage:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), black, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), black, transparent 72%)",
        }}
        aria-hidden
      />
      <ShaderBackground className="absolute inset-0 h-full w-full mix-blend-screen" />
    </>
  );
}
