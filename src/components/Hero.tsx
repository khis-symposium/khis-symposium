import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { HeroBackdrop } from "./ui/HeroBackdrop";
import { SITE } from "@/lib/constants";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pt-[72px]"
    >
      {/* Background: generative shader blended over a faint, pointer-revealed event photo */}
      <div className="absolute inset-0 -z-10 bg-[var(--color-void)]">
        <HeroBackdrop photoSrc="/images/symposium-2025.webp" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, rgba(4,8,28,0.92) 0%, rgba(4,8,28,0.55) 45%, rgba(4,8,28,0.35) 70%, rgba(4,8,28,0.55) 100%)",
          }}
          aria-hidden
        />
      </div>

      {/* Content vertically centered, single left-aligned column */}
      <div className="relative w-full py-20">
        <Container>
          <div className="flex max-w-2xl flex-col items-start gap-7">
            <h1 className="text-[clamp(1.75rem,5.4vw,4.5rem)] font-extrabold leading-[1.15] tracking-tight text-white sm:leading-[1.08]">
              <span className="block whitespace-normal sm:whitespace-nowrap">{SITE.heroTitleLine1}</span>
              <span className="block whitespace-normal sm:whitespace-nowrap">{SITE.heroTitleLine2}</span>
            </h1>

            <p className="max-w-lg text-[17px] leading-[1.7] text-white/70">{SITE.tagline}</p>

            <div className="flex flex-wrap gap-x-12 gap-y-5">
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.14em] text-[var(--color-cyan)]">
                  <CalendarBlank size={14} weight="bold" />
                  일시
                </p>
                <p className="mt-1.5 text-[16px] text-white/85">{SITE.dateLabel}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.14em] text-[var(--color-cyan)]">
                  <MapPin size={14} weight="bold" />
                  장소
                </p>
                <p className="mt-1.5 text-[16px] text-white/85">{SITE.venueLabel}</p>
              </div>
            </div>

            <Button href="#register" variant="primary" className="mt-2">
              사전등록 신청하기
            </Button>
          </div>
        </Container>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-cyan)]/40 to-transparent"
        aria-hidden
      />
    </section>
  );
}
