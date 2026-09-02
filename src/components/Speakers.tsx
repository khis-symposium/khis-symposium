import Image from "next/image";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";
import {
  SPEAKERS,
  SPEAKERS_PUBLISHED,
  getPublishedSpeakerDays,
  type Speaker,
} from "@/data/speakers";

type SpeakersProps = {
  published?: boolean;
  speakers?: readonly Speaker[];
};

function getPortraitClassName(speakerId: string) {
  const baseClassName = "object-contain object-bottom";

  switch (speakerId) {
    case "speaker-018":
      return `origin-top [scale:1.2_1.32] ${baseClassName}`;
    case "speaker-028":
      return `scale-[0.9] ${baseClassName}`;
    case "speaker-043":
      return `scale-[1.6] ${baseClassName}`;
    case "speaker-063":
      return `origin-top scale-[1.5] ${baseClassName}`;
    default:
      return baseClassName;
  }
}

function SpeakerPortrait({ speaker }: { speaker: Speaker }) {
  if (!speaker.imageSrc) {
    return <div aria-hidden="true" className="size-48 shrink-0 sm:size-[250px]" />;
  }

  return (
    <div className="relative size-48 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-line)] sm:size-[250px]">
      <Image
        src={speaker.imageSrc}
        alt={speaker.imageAlt}
        fill
        sizes="(min-width: 640px) 250px, 192px"
        className={getPortraitClassName(speaker.id)}
      />
    </div>
  );
}

export function Speakers({
  published = SPEAKERS_PUBLISHED,
  speakers = SPEAKERS,
}: SpeakersProps) {
  const days = getPublishedSpeakerDays(published, speakers);
  if (days.length === 0) return null;

  return (
    <section
      id="speakers"
      aria-labelledby="speakers-heading"
      className="on-light section-pad scroll-mt-24 bg-[var(--color-surface-2)]"
    >
      <Container>
        <SectionHeading
          eyebrow="SPEAKERS"
          title="연사 소개"
          description="일자와 세션별 기조연설, 좌장, 발표자 및 토론자를 안내드립니다."
          titleId="speakers-heading"
        />

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="연사 소개 일자 바로가기">
          {days.map((day) => (
            <a
              key={day.id}
              href={`#speakers-${day.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-[14px] font-bold text-[var(--color-blue)] transition-colors hover:border-[var(--color-blue)]"
            >
              {day.label}
            </a>
          ))}
        </nav>

        <div className="mt-12 flex flex-col gap-16">
          {days.map((day, dayIndex) => (
            <section
              key={day.id}
              id={`speakers-${day.id}`}
              aria-labelledby={`speakers-${day.id}-heading`}
              className="scroll-mt-24"
            >
              <Reveal delay={dayIndex * 80}>
                <div className="relative border-b border-[var(--color-line)] pb-4">
                  <h3 id={`speakers-${day.id}-heading`}>
                    <span className="block text-xl font-extrabold text-[var(--color-blue)]">
                      {day.label}
                    </span>
                    <span className="mt-1 block text-[13px] font-medium tracking-wide text-[var(--color-muted)]">
                      {day.dateLabel}
                    </span>
                  </h3>
                  <span
                    className="absolute -bottom-px left-0 h-[2px] w-full bg-gradient-to-r from-[var(--color-blue)] via-[var(--color-cyan)] to-transparent"
                    aria-hidden="true"
                  />
                </div>
              </Reveal>

              <div className="mt-8 flex flex-col gap-10">
                {day.sessions.map((session, sessionIndex) => (
                  <section
                    key={session.id}
                    aria-labelledby={`speakers-${day.id}-${session.id}-heading`}
                    className="min-w-0 rounded-[20px] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7"
                  >
                    <Reveal delay={Math.min(sessionIndex, 5) * 60}>
                      <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-bold tracking-wide text-[var(--color-blue)]">
                        <span>{session.trackLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{session.time}</span>
                      </p>
                      <h4
                        id={`speakers-${day.id}-${session.id}-heading`}
                        className="mt-2 text-[clamp(1.15rem,2.2vw,1.45rem)] font-extrabold leading-snug text-[var(--color-ink)] [overflow-wrap:anywhere] [word-break:keep-all]"
                      >
                        {session.title}
                      </h4>
                      <div className="rule-accent mt-3" />
                    </Reveal>

                    <ul className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {session.speakers.map((speaker, speakerIndex) => (
                        <Reveal
                          as="li"
                          key={speaker.id}
                          delay={Math.min(speakerIndex, 5) * 50}
                          className="min-w-0"
                        >
                          <article className="flex h-full min-w-0 flex-col items-center rounded-[16px] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 text-center">
                            <SpeakerPortrait speaker={speaker} />
                            <div className="mt-3 min-w-0 max-w-full">
                              <span className="inline-flex rounded-full bg-[var(--color-blue)]/10 px-3 py-1 text-[12px] font-bold text-[var(--color-blue)]">
                                {speaker.role}
                              </span>
                              <h5 className="mt-2 text-[21px] font-extrabold leading-tight text-[var(--color-ink)] [overflow-wrap:anywhere] [word-break:keep-all]">
                                {speaker.name}
                              </h5>
                              <p className="mt-2 text-[14px] font-semibold leading-snug text-[var(--color-ink-soft)] [overflow-wrap:anywhere] [word-break:keep-all]">
                                {speaker.affiliation}
                              </p>
                              <p className="mt-0.5 text-[14px] leading-snug text-[var(--color-muted)] [overflow-wrap:anywhere] [word-break:keep-all]">
                                {speaker.title}
                              </p>
                            </div>
                          </article>
                        </Reveal>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
