import Link from "next/link";
import { EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { FOOTER, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg-deep)] text-white/60">
      <Container className="flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-8 border-b border-[var(--color-line-dark)] pb-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-white">{FOOTER.orgName}</p>
            <p className="mt-2 max-w-sm text-[16px] leading-[1.8]">{FOOTER.address}</p>
          </div>

          <div className="flex flex-col gap-3 text-[16px]">
            <a href={`tel:${FOOTER.tel}`} className="flex items-center gap-2.5 hover:text-[var(--color-purple)]">
              <Phone size={16} className="text-[var(--color-cyan)]" />
              {FOOTER.tel}
            </a>
            <a href={`mailto:${FOOTER.email}`} className="flex items-center gap-2.5 hover:text-[var(--color-purple)]">
              <EnvelopeSimple size={16} className="text-[var(--color-cyan)]" />
              {FOOTER.email}
            </a>
          </div>
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
