"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { GlowingShadow } from "./ui/glowing-shadow";
import { PROGRAM, PROGRAM_INTRO, TRACK_LABELS, type ProgramTrackItem } from "@/lib/constants";

// Track 1 / Track 2 run in different rooms — color-coded (blue / purple) so
// they stay visually distinguishable at a glance, not just by label text.
const TRACK_ACCENT = {
  track1: { bg: "bg-[var(--color-blue)]/10", text: "text-[var(--color-blue)]" },
  track2: { bg: "bg-[var(--color-purple)]/10", text: "text-[var(--color-purple)]" },
} as const;

function TrackBlock({
  label,
  item,
  accent,
}: {
  label: string;
  item?: ProgramTrackItem;
  accent: keyof typeof TRACK_ACCENT;
}) {
  const { bg, text } = TRACK_ACCENT[accent];
  if (!item) {
    return (
      <div>
        <span className={`rounded-[4px] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${bg} ${text} opacity-50`}>
          {label}
        </span>
        <p className="mt-2 text-[16px] text-[var(--color-muted)]">-</p>
      </div>
    );
  }
  return (
    <div>
      <span className={`rounded-[4px] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${bg} ${text}`}>
        {label}
      </span>
      <h3 className="mt-2 text-[16px] font-bold leading-snug text-[var(--color-ink)] [word-break:keep-all] [overflow-wrap:break-word]">
        {item.title}
      </h3>
      {item.speaker || item.affiliation ? (
        <p className="mt-1.5 text-[14px] text-[var(--color-muted)]">
          {[item.speaker, item.affiliation].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export function Program() {
  const [activeDay, setActiveDay] = useState(PROGRAM[0].id);

  return (
    <section id="program" className="on-light section-pad bg-[var(--color-surface)]">
      <Container>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Left: sticky intro + visual collage */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">{PROGRAM_INTRO.eyebrow}</span>
            <h2 className="mt-4 text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.2] tracking-tight text-[var(--color-ink)]">
              {PROGRAM_INTRO.title}
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-[1.8] text-[var(--color-muted)] [word-break:keep-all] [overflow-wrap:break-word]">
              {PROGRAM_INTRO.description}
            </p>
            <a
              href={PROGRAM_INTRO.leafletUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="mt-5 inline-flex items-center gap-1.5 text-[16px] font-semibold text-[var(--color-cyan)] transition-colors hover:text-[var(--color-purple)]"
            >
              {PROGRAM_INTRO.linkLabel}
              <ArrowRight size={16} />
            </a>

            {/* Visual collage — 2025 심포지엄 현장 사진, 살짝 겹치게 + 블루 톤 오버레이.
                컨테이너 너비는 위 설명문(max-w-md)과 맞춤 */}
            <div className="relative mt-12 hidden h-[280px] w-full max-w-md sm:block">
              <div className="absolute left-0 top-0 h-[200px] w-[220px] rounded-[16px] shadow-[var(--shadow-card)]">
                <GlowingShadow>
                  <div className="relative h-full w-full overflow-hidden rounded-[16px]">
                    <Image
                      src="/images/symposium-2025-b.jpg"
                      alt="2025 한국보건의료정보원 연례 심포지엄 현장"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-blue)]/45 via-[var(--color-blue)]/15 to-[var(--color-void)]/35 mix-blend-color" />
                  </div>
                </GlowingShadow>
              </div>
              <div className="absolute bottom-0 left-[180px] h-[220px] w-[260px] rounded-[16px] shadow-[var(--shadow-card-hover)]">
                <GlowingShadow>
                  <div className="relative h-full w-full overflow-hidden rounded-[16px]">
                    <Image
                      src="/images/symposium-2025.webp"
                      alt="2025 한국보건의료정보원 연례 심포지엄 패널 토론"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-blue)]/45 via-[var(--color-blue)]/15 to-[var(--color-void)]/35 mix-blend-color" />
                  </div>
                </GlowingShadow>
              </div>
            </div>
          </Reveal>

          {/* Right: day tabs + timeline */}
          <div>
            <Reveal delay={80}>
              <div role="tablist" aria-label="일자 선택" className="flex w-full border-b border-[var(--color-line)]">
                {PROGRAM.map((d) => {
                  const isActive = d.id === activeDay;
                  return (
                    <button
                      key={d.id}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${d.id}`}
                      id={`tab-${d.id}`}
                      onClick={() => setActiveDay(d.id)}
                      className={`relative min-h-[44px] px-2 pb-4 pr-8 text-left transition-colors duration-200 cursor-pointer ${
                        isActive ? "text-[var(--color-blue)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-soft)]"
                      }`}
                    >
                      <span className="text-lg font-extrabold">{d.dayLabel}</span>
                      <span className="mt-1 block text-[12px] tracking-wide">{d.dateLabel}</span>
                      {isActive ? (
                        <span className="absolute -bottom-px left-0 h-[2px] w-full bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-cyan)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Reveal>

            {/*
              All day-panels are always mounted and stacked in the same grid
              cell (col-start-1 row-start-1) — only the active one is visible.
              Because they share one cell, the grid's row height is computed
              from the tallest panel, so the section's overall height stays
              fixed across DAY 1 / DAY 2 instead of jumping when the days
              have a different number of lines.
            */}
            <div className="mt-2 grid">
              {PROGRAM.map((d) => {
                const isActiveDay = d.id === activeDay;
                return (
                  <div
                    key={d.id}
                    role="tabpanel"
                    id={`panel-${d.id}`}
                    aria-labelledby={`tab-${d.id}`}
                    aria-hidden={!isActiveDay}
                    className={`col-start-1 row-start-1 transition-opacity duration-200 ${
                      isActiveDay ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <ol className="flex flex-col">
                      {d.slots.map((slot, i) => (
                        <Reveal as="li" key={`${d.id}-${i}`} delay={Math.min(i, 6) * 50}>
                          <div className="grid grid-cols-[minmax(84px,110px)_1fr] items-center gap-4 border-b border-[var(--color-line)]/70 py-6 sm:gap-8">
                            <div className="text-center text-[16px] font-semibold tracking-wide text-[var(--color-muted)]">
                              {slot.time}
                              {slot.duration ? (
                                <span className="mt-0.5 block text-[12px] font-normal text-[var(--color-muted)]/70">
                                  {slot.duration}
                                </span>
                              ) : null}
                            </div>

                            {slot.shared ? (
                              <h3 className="text-center text-[16px] font-bold text-[var(--color-ink)] [word-break:keep-all] [overflow-wrap:break-word]">
                                {slot.shared.title}
                              </h3>
                            ) : (
                              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <TrackBlock label={TRACK_LABELS.track1} item={slot.track1} accent="track1" />
                                <TrackBlock label={TRACK_LABELS.track2} item={slot.track2} accent="track2" />
                              </div>
                            )}
                          </div>
                        </Reveal>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
