"use client";

import { useState } from "react";
import { ArrowRight, Microphone } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { PROGRAM, PROGRAM_INTRO } from "@/lib/constants";

export function Program() {
  const [activeDay, setActiveDay] = useState(PROGRAM[0].id);
  const day = PROGRAM.find((d) => d.id === activeDay) ?? PROGRAM[0];

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
            <p className="mt-5 max-w-md text-[16px] leading-[1.8] text-[var(--color-muted)]">
              {PROGRAM_INTRO.description}
            </p>
            <a
              href="#register"
              className="mt-5 inline-flex items-center gap-1.5 text-[16px] font-semibold text-[var(--color-cyan)] transition-colors hover:text-[var(--color-purple)]"
            >
              {PROGRAM_INTRO.linkLabel}
              <ArrowRight size={16} />
            </a>

            {/* Visual collage placeholder — swap PROGRAM_INTRO.image1/2 for real photos */}
            <div className="relative mt-12 hidden h-[220px] w-full max-w-[340px] sm:block">
              <div
                className="absolute left-0 top-0 h-[170px] w-[190px] rounded-[16px] shadow-[var(--shadow-card)]"
                style={{
                  backgroundImage:
                    "linear-gradient(150deg, rgba(4,8,28,0.95) 0%, rgba(11,45,107,0.95) 100%)",
                }}
              />
              <div
                className="absolute bottom-0 left-[110px] h-[190px] w-[210px] rounded-[16px] shadow-[var(--shadow-card-hover)]"
                style={{
                  backgroundImage:
                    "linear-gradient(150deg, rgba(22,166,240,0.85) 0%, rgba(8,112,188,0.9) 100%)",
                }}
              />
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
                        isActive ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-soft)]"
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

            <div role="tabpanel" id={`panel-${day.id}`} aria-labelledby={`tab-${day.id}`} className="mt-2">
              <ol className="flex flex-col">
                {day.sessions.map((session, i) => (
                  <Reveal as="li" key={`${day.id}-${i}`} delay={Math.min(i, 6) * 50}>
                    <div className="grid grid-cols-[minmax(84px,110px)_1fr] gap-4 border-b border-[var(--color-line)]/70 py-6 sm:gap-8">
                      <div className="pt-1 text-[16px] font-semibold tracking-wide text-[var(--color-muted)]">
                        {session.time}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          {session.track ? (
                            <span className="rounded-[4px] bg-[var(--color-blue)]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--color-blue)]">
                              {session.track}
                            </span>
                          ) : null}
                          <h3 className="text-[17px] font-bold leading-snug text-[var(--color-ink)]">
                            {session.title}
                          </h3>
                        </div>
                        {session.speaker ? (
                          <p className="mt-2 flex items-center gap-2 text-[16px] text-[var(--color-muted)]">
                            <Microphone size={15} className="text-[var(--color-blue)]" />
                            {session.speaker}
                            {session.affiliation ? ` · ${session.affiliation}` : ""}
                          </p>
                        ) : null}
                        {session.description ? (
                          <p className="mt-3 max-w-xl text-[16px] leading-[1.75] text-[var(--color-muted)]">
                            {session.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
