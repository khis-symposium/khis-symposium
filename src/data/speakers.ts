export const SPEAKERS_PUBLISHED = false;

export const SPEAKER_DAYS = [
  { id: "day1", label: "DAY 1", dateLabel: "2026. 09. 10.(목)" },
  { id: "day2", label: "DAY 2", dateLabel: "2026. 09. 11.(금)" },
] as const;

export type SpeakerDayId = (typeof SPEAKER_DAYS)[number]["id"];

export type Speaker = {
  id: string;
  dayId: SpeakerDayId;
  sessionId: string;
  sessionTitle: string;
  role: string;
  name: string;
  affiliation: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
};

// Confirmed speaker data will be added here after the client supplies it.
// Do not commit test fixtures or inferred people to this production source.
export const SPEAKERS: readonly Speaker[] = [];

export type SpeakerSessionGroup = {
  id: string;
  title: string;
  speakers: readonly Speaker[];
};

export type SpeakerDayGroup = (typeof SPEAKER_DAYS)[number] & {
  sessions: readonly SpeakerSessionGroup[];
};

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidSpeaker(speaker: Speaker): boolean {
  const hasRequiredText = [
    speaker.id,
    speaker.dayId,
    speaker.sessionId,
    speaker.sessionTitle,
    speaker.role,
    speaker.name,
    speaker.affiliation,
    speaker.title,
  ].every(isNonEmptyText);

  if (!hasRequiredText) return false;
  if (!SPEAKER_DAYS.some((day) => day.id === speaker.dayId)) return false;
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(speaker.id)) return false;
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(speaker.sessionId)) return false;

  const imageSrc = speaker.imageSrc.trim();
  const imageAlt = speaker.imageAlt.trim();
  if (Boolean(imageSrc) !== Boolean(imageAlt)) return false;
  if (imageSrc && !imageSrc.startsWith("/images/speakers/")) return false;

  return true;
}

export function isSpeakerSectionPublished(
  published: boolean,
  speakers: readonly Speaker[]
): boolean {
  if (!published || speakers.length === 0 || !speakers.every(isValidSpeaker)) return false;

  const speakerIds = new Set(speakers.map((speaker) => speaker.id));
  if (speakerIds.size !== speakers.length) return false;

  const sessionTitles = new Map<string, string>();
  for (const speaker of speakers) {
    const sessionKey = `${speaker.dayId}:${speaker.sessionId}`;
    const existingTitle = sessionTitles.get(sessionKey);
    if (existingTitle && existingTitle !== speaker.sessionTitle.trim()) return false;
    sessionTitles.set(sessionKey, speaker.sessionTitle.trim());
  }

  // The published section always exposes both days in the initial document.
  return SPEAKER_DAYS.every((day) =>
    speakers.some((speaker) => speaker.dayId === day.id)
  );
}

export function getPublishedSpeakerDays(
  published: boolean,
  speakers: readonly Speaker[]
): readonly SpeakerDayGroup[] {
  if (!isSpeakerSectionPublished(published, speakers)) return [];

  return SPEAKER_DAYS.map((day) => {
    const sessions = new Map<string, SpeakerSessionGroup>();

    for (const speaker of speakers.filter((entry) => entry.dayId === day.id)) {
      const existingSession = sessions.get(speaker.sessionId);
      if (existingSession) {
        sessions.set(speaker.sessionId, {
          ...existingSession,
          speakers: [...existingSession.speakers, speaker],
        });
      } else {
        sessions.set(speaker.sessionId, {
          id: speaker.sessionId,
          title: speaker.sessionTitle,
          speakers: [speaker],
        });
      }
    }

    return { ...day, sessions: [...sessions.values()] };
  });
}

export function getSpeakerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return `${Array.from(words[0])[0] ?? ""}${Array.from(words.at(-1) ?? "")[0] ?? ""}`.toUpperCase();
  }
  return Array.from(words[0] ?? "").slice(0, 2).join("").toUpperCase();
}

export const SPEAKERS_VISIBLE = isSpeakerSectionPublished(
  SPEAKERS_PUBLISHED,
  SPEAKERS
);
