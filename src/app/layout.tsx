import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/constants";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.year} ${SITE.shortName}`,
  description: SITE.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-surface)] text-[var(--color-ink)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-bg-deep)] focus:px-4 focus:py-2 focus:text-[16px] focus:text-white"
        >
          본문 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}
