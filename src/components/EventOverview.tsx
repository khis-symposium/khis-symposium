import Image from "next/image";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { SITE } from "@/lib/constants";

const ROWS = [
  { label: "일정", value: SITE.dateLabel },
  { label: "장소", value: SITE.venueLabel },
  { label: "주제", value: SITE.tagline },
] as const;

const ROW_GRID =
  "grid grid-cols-[88px_1fr] gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-8";

export function EventOverview() {
  return (
    <section id="overview" className="relative overflow-hidden section-pad">
      {/* Background: subtle navy gradient (muted, not far above the base navy) with a faint grain texture */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #04081c 0%, #0a1f4a 55%, #123a70 100%)",
        }}
        aria-hidden
      />
      <div className="grain-overlay absolute inset-0 -z-10" aria-hidden />

      <Container>
        <SectionHeading
          eyebrow="OVERVIEW"
          title="행사 개요"
          description="한국보건의료정보원이 마련한 이번 심포지엄의 주요 개요를 안내드립니다."
        />

        <Reveal delay={100} className="mt-12">
          <div
            className="on-light w-full rounded-[28px] bg-[var(--color-surface)] p-8 sm:p-12"
            style={{ boxShadow: "0 40px 80px -24px rgba(0,0,0,0.55), 0 12px 32px -12px rgba(0,0,0,0.4)" }}
          >
            <h3 className="text-[clamp(1.35rem,2.6vw,1.75rem)] font-extrabold leading-snug text-[var(--color-ink)]">
              {SITE.name}
            </h3>

            <div className="mt-8 divide-y divide-[var(--color-line)]">
              {ROWS.map((row) => (
                <div key={row.label} className={ROW_GRID}>
                  <span className="text-[16px] font-bold text-[var(--color-cyan)]">{row.label}</span>
                  <span className="text-[16px] leading-[1.6] text-[var(--color-ink-soft)]">{row.value}</span>
                </div>
              ))}

              <div className={ROW_GRID}>
                <span className="text-[16px] font-bold text-[var(--color-cyan)]">주최‧주관</span>
                <Image
                  src="/images/khis-logo.png"
                  alt={SITE.orgName}
                  width={2126}
                  height={591}
                  className="h-8 w-auto object-contain object-left"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
