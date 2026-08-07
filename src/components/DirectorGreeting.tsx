import Image from "next/image";
import { Quotes } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { DIRECTOR_GREETING as G } from "@/lib/constants";

export function DirectorGreeting() {
  return (
    <section id="greeting" className="on-light section-pad bg-[var(--color-surface)]">
      <Container>
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[280px_1fr] md:gap-20">
          <Reveal className="flex flex-col items-center gap-6 md:items-start">
            <div className="relative aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-[12px]">
              {G.portraitImage ? (
                <Image src={G.portraitImage} alt={G.name} fill className="object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(155deg, rgba(22,166,240,0.22) 0%, rgba(8,112,188,0.3) 100%)",
                    backgroundColor: "var(--color-surface-2)",
                  }}
                >
                  <span className="text-5xl font-extrabold text-[var(--color-cyan)]/70">
                    {G.name.replace(/\s/g, "").slice(0, 1)}
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-[12px] border border-[var(--color-line)]" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-lg font-bold text-[var(--color-ink)]">{G.name}</p>
              <p className="mt-1 text-[16px] text-[var(--color-muted)]">{G.title}</p>
            </div>
          </Reveal>

          <div>
            <Reveal className="flex flex-col gap-4">
              <span className="eyebrow">GREETING</span>
              <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-[1.25] tracking-tight text-[var(--color-ink)]">
                원장 인사말
              </h2>
              <div className="rule-accent" />
            </Reveal>

            <Reveal delay={100} className="relative mt-8">
              <Quotes size={40} weight="fill" className="text-[#0a1a3d]/10" />
              <div className="mt-4 flex flex-col gap-5">
                {G.paragraphs.map((p, i) => (
                  <p key={i} className="text-[16px] leading-[1.9] text-[var(--color-ink-soft)]">
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
