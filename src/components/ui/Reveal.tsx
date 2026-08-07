"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms, applied via inline transition-delay */
  delay?: number;
  className?: string;
  as?: "div" | "li";
};

/**
 * Fades + lifts content into view once it enters (or has already passed)
 * the viewport. No-ops visually when prefers-reduced-motion is set (see
 * .reveal in globals.css).
 *
 * Deliberately generous about triggering: a large rootMargin + threshold 0
 * means content is revealed well before/after it's strictly on-screen, so
 * fast scrolling, Page Down jumps, or landing directly on a URL hash never
 * leaves a section permanently stuck at opacity:0.
 */
export function Reveal({ children, delay = 0, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Safety net: if the element is already on screen or has already been
    // scrolled past at mount time (e.g. a #hash deep link, or a fast jump
    // during hydration), show it immediately instead of waiting on an
    // observer callback that may never see it "entering".
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > -window.innerHeight) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "200px 0px 200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${isVisible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
