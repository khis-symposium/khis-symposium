import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { FOOTER, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-deep)] text-white/60">
      <Container className="flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-6 border-b border-[var(--color-line-dark)] pb-10 sm:flex-row sm:items-center sm:justify-start">
          <a
            href={FOOTER.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-4 self-start"
          >
            <span className="inline-flex items-center rounded-lg bg-white px-4 py-2.5">
              <Image
                src={FOOTER.logoImage}
                alt={FOOTER.orgName}
                width={2126}
                height={591}
                className="h-9 w-auto"
              />
            </span>
            <span className="inline-flex items-center gap-1 text-[16px] font-semibold text-[var(--color-cyan)] transition-colors group-hover:text-[var(--color-purple)]">
              바로가기
              <ArrowUpRight size={16} />
            </span>
          </a>
        </div>

        <div className="flex flex-col-reverse items-start gap-4 text-[16px] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {SITE.year} {SITE.orgName}. All rights reserved.
          </p>
          <nav className="flex gap-6" aria-label="법적 고지">
            {FOOTER.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-[var(--color-purple)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
