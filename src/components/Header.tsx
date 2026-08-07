"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? "bg-[var(--color-bg-deep)]/95 shadow-[0_1px_0_var(--color-line-dark)] backdrop-blur-md"
          : "bg-gradient-to-b from-[var(--color-bg-deep)]/70 to-transparent"
      }`}
    >
      <div className="container-symposium flex h-[72px] items-center justify-between">
        <Link
          href="#top"
          className="flex flex-col leading-tight"
          aria-label={`${SITE.orgName} 홈으로 이동`}
        >
          <span className="text-[14px] font-bold text-white sm:text-[15px]">{SITE.name}</span>
          <span className="mt-0.5 text-[9px] tracking-[0.14em] text-[var(--color-cyan)] sm:text-[10px]">
            {SITE.year} KHIS ANNUAL SYMPOSIUM
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10" aria-label="주요 메뉴">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[16px] text-white/75 transition-colors duration-200 hover:text-[var(--color-purple)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="#register"
            className="btn-glow inline-flex min-h-[44px] items-center rounded-full px-6 text-[16px] font-semibold text-white"
          >
            사전등록
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center text-white md:hidden"
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {isMenuOpen ? (
        <button
          type="button"
          aria-label="메뉴 닫기 배경"
          tabIndex={-1}
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-x-0 top-[72px] bottom-0 -z-10 cursor-default bg-[var(--color-bg-deep)]/60 backdrop-blur-[2px] md:hidden"
        />
      ) : null}

      {isMenuOpen ? (
        <div className="border-t border-[var(--color-line-dark)] bg-[var(--color-bg-deep)] md:hidden">
          <nav className="container-symposium flex flex-col py-4" aria-label="모바일 메뉴">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="min-h-[44px] border-b border-[var(--color-line-dark)] py-3 text-[16px] text-white/80 last:border-none"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#register"
              onClick={() => setIsMenuOpen(false)}
              className="btn-glow mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-[16px] font-semibold text-white"
            >
              사전등록
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
