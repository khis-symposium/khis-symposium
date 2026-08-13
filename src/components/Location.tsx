import { Fragment } from "react";
import Image from "next/image";
import { Bus, MapPin, Train } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { LOCATION } from "@/lib/constants";

export function Location() {
  return (
    <section id="location" className="relative overflow-hidden section-pad">
      {/* Background: dark navy with a radiating dot pattern fading in from the corner */}
      <div className="absolute inset-0 -z-10 bg-[var(--color-void)]">
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage: "radial-gradient(rgba(22,166,240,0.9) 1px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 100% 85% at 100% 100%, black 0%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 85% at 100% 100%, black 0%, transparent 78%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 60% at 88% 92%, rgba(22,166,240,0.22), transparent 70%)",
          }}
          aria-hidden
        />
      </div>

      <Container>
        <SectionHeading
          eyebrow="LOCATION"
          title="오시는 길"
          description="심포지엄이 열리는 장소와 교통편을 안내드립니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:gap-14">
          {/* Venue details */}
          <Reveal className="flex flex-col gap-8">
            <div className="flex items-start gap-3">
              <MapPin size={22} className="mt-0.5 shrink-0 text-[var(--color-cyan)]" />
              <div>
                <p className="text-lg font-bold text-[var(--color-ink)]">{LOCATION.venueName}</p>
                <p className="mt-1 text-[16px] leading-[1.7] text-[var(--color-muted)]">
                  {LOCATION.address}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Train size={20} className="shrink-0 text-[var(--color-cyan)]" />
                  <p className="text-[16px] font-semibold tracking-[0.06em] text-[var(--color-ink)]">
                    지하철 이용 시
                  </p>
                </div>
                <div className="flex flex-col gap-3 pl-8">
                  {LOCATION.subwayRoutes.map((route) => (
                    <p key={route.line} className="text-[16px] leading-[1.7] text-[var(--color-ink-soft)]">
                      <span className="font-semibold" style={{ color: route.color }}>
                        {route.line}
                      </span>
                      <br />
                      {route.detail.map((line, i) => (
                        <Fragment key={i}>
                          {line}
                          {i < route.detail.length - 1 ? <br /> : null}
                        </Fragment>
                      ))}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--color-line-dark)] pt-5">
                <div className="flex items-center gap-3">
                  <Bus size={20} className="shrink-0 text-[var(--color-cyan)]" />
                  <p className="text-[16px] font-semibold tracking-[0.06em] text-[var(--color-ink)]">
                    버스 이용 시
                  </p>
                </div>
                <div className="grid grid-cols-[72px_1fr] gap-y-1.5 pl-8 text-[16px] leading-[1.7]">
                  {LOCATION.busRoutes.map((route) => (
                    <Fragment key={route.type}>
                      <span className="font-semibold text-[var(--color-ink)]">{route.type}</span>
                      <span className="text-[var(--color-ink-soft)]">{route.numbers}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Full final artwork, including the venue highlight in the source image. */}
          <Reveal delay={100}>
            <div className="rounded-[12px] border border-[var(--color-cyan)]/25 bg-[#e4f4f7] p-1 shadow-2xl">
              <div className="flex items-center gap-2 rounded-[8px] bg-[var(--color-void)] px-3 py-2.5 text-white sm:px-4">
                <MapPin size={18} weight="fill" className="shrink-0 text-[var(--color-cyan)]" />
                <p className="text-[12px] font-semibold leading-snug sm:text-[14px]">
                  행사장 · 코엑스 컨퍼런스룸 401·402호
                </p>
              </div>

              <div className="relative mt-1 aspect-[5906/2216] w-full">
                <Image
                  src="/images/location-map-20260813-v2.png"
                  alt="코엑스 컨퍼런스룸 401·402호 위치를 강조한 행사장 약도"
                  width={5906}
                  height={2216}
                  sizes="(max-width: 1023px) calc(100vw - 3.5rem), 64vw"
                  unoptimized
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
