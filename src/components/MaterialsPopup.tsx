"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function MaterialsPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.documentElement.style.overflow;
    const restoreScroll = () => {
      document.documentElement.style.overflow = previousOverflow;
    };
    dialog.addEventListener("close", restoreScroll);
    dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("close", restoreScroll);
      dialog.close();
      restoreScroll();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="materials-popup-heading"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      className="on-light fixed inset-0 m-auto max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px),calc((100dvh-144px)*0.66693))] max-w-none overflow-auto rounded-xl border-0 bg-white p-0 text-[var(--color-ink)] shadow-xl backdrop:bg-black/65"
    >
      <form method="dialog">
        <header className="flex items-center justify-between gap-2 px-3 py-1">
          <h2 id="materials-popup-heading" className="text-base font-bold">
            발표자료집 안내
          </h2>
          <button
            type="submit"
            aria-label="팝업 닫기"
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <Image
          src="/images/popup.jpg"
          alt="발표자료집 확인. QR코드를 스캔해서 발표자료를 확인하세요."
          width={1668}
          height={2501}
          sizes="(max-width: 584px) calc(100vw - 24px), 560px"
          unoptimized
          loading="eager"
          className="block h-auto w-full object-contain"
        />
        <footer className="p-3">
          <button
            type="submit"
            className="min-h-11 w-full cursor-pointer rounded-lg bg-[var(--color-blue)] px-5 py-2.5 font-semibold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            확인
          </button>
        </footer>
      </form>
    </dialog>
  );
}
