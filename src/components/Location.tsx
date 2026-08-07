import {
  Bus,
  Car,
  EnvelopeSimple,
  MapPin,
  Phone,
  Train,
} from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { LOCATION, FOOTER } from "@/lib/constants";

export function Location() {
  return (
    <section id="location" className="section-pad bg-[var(--color-surface-2)]">
      <Container>
        <SectionHeading
          eyebrow="LOCATION"
          title="오시는 길"
          description="심포지엄이 열리는 장소와 교통편을 안내드립니다."
        />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
          {/* Venue details */}
          <Reveal className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <MapPin size={22} className="mt-0.5 shrink-0 text-[var(--color-cyan)]" />
                <div>
                  <p className="text-lg font-bold text-[var(--color-ink)]">
                    {LOCATION.venueName}
                  </p>
                  <p className="mt-1 text-[16px] leading-[1.7] text-[var(--color-muted)]">
                    {LOCATION.address}
                    <br />
                    {LOCATION.addressDetail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t border-[var(--color-line)] pt-6">
              <div className="flex items-start gap-3">
                <Train size={20} className="mt-0.5 shrink-0 text-[var(--color-cyan)]" />
                <div>
                  <p className="text-[13px] font-semibold tracking-[0.06em] text-[var(--color-ink)]">
                    지하철 이용 시
                  </p>
                  <p className="mt-1 text-[16px] leading-[1.7] text-[var(--color-ink-soft)]">
                    {LOCATION.subway.line}
                    <br />
                    {LOCATION.subway.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bus size={20} className="mt-0.5 shrink-0 text-[var(--color-cyan)]" />
                <div>
                  <p className="text-[13px] font-semibold tracking-[0.06em] text-[var(--color-ink)]">
                    버스 이용 시
                  </p>
                  <p className="mt-1 text-[16px] leading-[1.7] text-[var(--color-ink-soft)]">
                    {LOCATION.bus.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car size={20} className="mt-0.5 shrink-0 text-[var(--color-cyan)]" />
                <div>
                  <p className="text-[13px] font-semibold tracking-[0.06em] text-[var(--color-ink)]">
                    주차 안내
                  </p>
                  <p className="mt-1 text-[16px] leading-[1.7] text-[var(--color-ink-soft)]">
                    {LOCATION.parking}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-6 text-[16px] text-[var(--color-ink-soft)]">
              <a href={`tel:${FOOTER.tel}`} className="flex items-center gap-2.5 hover:text-[var(--color-purple)]">
                <Phone size={16} className="text-[var(--color-cyan)]" />
                {FOOTER.tel}
              </a>
              <a
                href={`mailto:${FOOTER.email}`}
                className="flex items-center gap-2.5 hover:text-[var(--color-purple)]"
              >
                <EnvelopeSimple size={16} className="text-[var(--color-cyan)]" />
                {FOOTER.email}
              </a>
            </div>
          </Reveal>

          {/* Map: swaps to an embedded map (Kakao/Naver Maps iframe) once LOCATION.mapEmbedUrl is set */}
          <Reveal delay={100}>
            {LOCATION.mapEmbedUrl ? (
              <iframe
                src={LOCATION.mapEmbedUrl}
                title="심포지엄 장소 지도"
                className="h-[360px] w-full rounded-[12px] border border-[var(--color-line)] lg:h-full lg:min-h-[420px]"
                loading="lazy"
              />
            ) : (
              <div className="relative h-[360px] w-full overflow-hidden rounded-[12px] border border-white/10 bg-[var(--color-void)] lg:h-full lg:min-h-[420px]">
                <div
                  className="absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(22,166,240,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(22,166,240,0.16) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                  }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(4,8,28,0) 0%, var(--color-void) 75%)",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <MapPin size={34} weight="fill" className="text-[var(--color-cyan)]" />
                  <p className="text-lg font-bold text-white">{LOCATION.venueName}</p>
                  <p className="text-[13px] text-white/55">{LOCATION.address}</p>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
