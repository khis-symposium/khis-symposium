"use client";

import { useState, type FormEvent } from "react";
import { CaretDown, CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import {
  AFFILIATION_OPTIONS,
  PRIVACY_NOTICE,
  REGISTRATION_SESSIONS,
  TRACK_LABELS,
  type RegistrationSessionOption,
  updateRegistrationSessionSelection,
} from "@/lib/constants";
import { buildRegistrationPayload } from "@/lib/registration-payload";

type Status = "idle" | "submitting" | "success" | "error";
type Errors = Record<string, string>;

const labelBase = "text-[16px] font-medium text-white/70";

function fieldClass(hasError: boolean) {
  return `w-full min-h-[44px] rounded-xl border ${
    hasError ? "border-red-500 focus:border-red-500" : "border-white/15 focus:border-[var(--color-cyan)]"
  } bg-white/[0.06] px-4 py-2.5 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-white/35`;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] text-red-400" role="alert">
      <WarningCircle size={14} weight="fill" />
      {message}
    </p>
  );
}

function RegistrationSessionCheckbox({
  session,
  selected,
  onToggle,
}: {
  session: RegistrationSessionOption;
  selected: boolean;
  onToggle: (sessionId: string, checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 p-2.5 transition-colors duration-200 has-[:checked]:border-[var(--color-cyan)] has-[:checked]:bg-[var(--color-cyan)]/10">
      <input
        type="checkbox"
        name="sessions"
        value={session.id}
        checked={selected}
        onChange={(event) => onToggle(session.id, event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-cyan)]"
      />
      <span>
        <span className="block text-[12px] text-white/45">{session.time}</span>
        <span className="block whitespace-pre-line text-[14px] font-medium leading-snug text-white [word-break:keep-all]">
          {session.title}
        </span>
      </span>
    </label>
  );
}

const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 숫자만 입력해도 010-0000-0000 형식으로 자동 하이픈 삽입 — 모바일 숫자 키패드에
// '-' 키가 없는 경우가 많아, 입력값에서 숫자만 추출해 형식을 맞춰준다.
// 02(서울) 지역번호는 2자리, 그 외 휴대폰/지역번호는 3자리로 구분해 그룹핑한다.
function formatPhoneNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;

  if (digits.startsWith("02")) {
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function validate(formData: FormData): Errors {
  const errors: Errors = {};

  if (!String(formData.get("name") ?? "").trim()) {
    errors.name = "성명을 입력해 주세요.";
  }
  if (!String(formData.get("affiliationType") ?? "").trim()) {
    errors.affiliationType = "소속분류를 선택해 주세요.";
  }
  if (!String(formData.get("orgName") ?? "").trim()) {
    errors.orgName = "소속명을 입력해 주세요.";
  }

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) {
    errors.phone = "연락처를 입력해 주세요.";
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "올바른 연락처 형식이 아닙니다. (예: 010-1234-0000)";
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    errors.email = "이메일을 입력해 주세요.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  }

  if (formData.getAll("sessions").length === 0) {
    errors.sessions = "참여하실 세션을 1개 이상 선택해 주세요.";
  }
  if (formData.get("consent") !== "agree") {
    errors.consent = "개인정보 수집·이용에 동의해 주세요.";
  }

  return errors;
}

export function Registration() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [phone, setPhone] = useState("");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  const sessionGroups = [
    {
      id: "day1",
      dayLabel: "1일차",
      dateLabel: "9.10.(목)",
      items: REGISTRATION_SESSIONS.filter((session) => session.dayId === "day1"),
    },
    {
      id: "day2",
      dayLabel: "2일차",
      dateLabel: "9.11.(금)",
      items: REGISTRATION_SESSIONS.filter((session) => session.dayId === "day2"),
    },
  ] as const;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstField = form.querySelector<HTMLElement>(`[name="${Object.keys(validationErrors)[0]}"]`);
      firstField?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const payload = buildRegistrationPayload(formData);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("ok" in result) ||
        result.ok !== true
      ) {
        throw new Error("Registration request failed");
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="register" className="section-pad bg-[var(--color-bg-deep)] text-white">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-24">
          <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">REGISTRATION</span>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-[1.3] tracking-tight">
              사전 등록
            </h2>
            <div className="rule-accent" />
            <p className="max-w-md text-[16px] leading-[1.9] text-white/70">
              사전 등록을 통해 심포지엄을 참여하실 수 있습니다.
              <br />
              등록 마감 전 신청해 주시기 바랍니다.
            </p>
          </Reveal>

          <Reveal delay={100}>
            {status === "success" ? (
              <div className="flex flex-col items-start gap-4 rounded-[12px] border border-[var(--color-cyan)]/25 bg-white/[0.04] p-10">
                <CheckCircle size={36} weight="fill" className="text-[var(--color-cyan)]" />
                <h3 className="text-xl font-bold">사전 등록이 접수되었습니다</h3>
                <p className="text-[16px] leading-[1.8] text-white/70">
                  입력하신 이메일로 확인 안내를 보내드릴 예정입니다.
                  <br />
                  심포지엄에서 뵙기를 기대합니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
                {status === "error" ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300">
                    <WarningCircle size={18} weight="fill" />
                    제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className={labelBase}>
                      성명 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="홍길동"
                      className={fieldClass(!!errors.name)}
                    />
                    <ErrorText message={errors.name} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="affiliationType" className={labelBase}>
                      소속분류 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="affiliationType"
                        name="affiliationType"
                        required
                        defaultValue=""
                        className={`${fieldClass(
                          !!errors.affiliationType
                        )} cursor-pointer appearance-none pr-10 invalid:text-white/35`}
                      >
                        <option value="" disabled hidden>
                          선택해 주세요
                        </option>
                        {AFFILIATION_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-[#0b1330] text-white"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <CaretDown
                        size={16}
                        weight="bold"
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                      />
                    </div>
                    <ErrorText message={errors.affiliationType} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="orgName" className={labelBase}>
                      소속명 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="orgName"
                      name="orgName"
                      type="text"
                      autoComplete="organization"
                      placeholder="예) 한국보건의료정보원"
                      className={fieldClass(!!errors.orgName)}
                    />
                    <ErrorText message={errors.orgName} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="position" className={labelBase}>
                      직위
                    </label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      autoComplete="organization-title"
                      placeholder="예) 팀장"
                      className={fieldClass(false)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className={labelBase}>
                      연락처 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="010-1234-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      className={fieldClass(!!errors.phone)}
                    />
                    <ErrorText message={errors.phone} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className={labelBase}>
                      이메일 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      className={fieldClass(!!errors.email)}
                    />
                    <ErrorText message={errors.email} />
                  </div>
                </div>

                <fieldset className="flex flex-col gap-3">
                  <legend className={labelBase}>
                    참여세션{" "}
                    <span className="text-[13px] font-normal text-white/45">
                      (총 {REGISTRATION_SESSIONS.length}개 · 동일 시간대 1개만 선택 가능)
                    </span>{" "}
                    <span className="text-[var(--color-cyan)]">*</span>
                  </legend>
                  <div className="flex flex-col gap-4">
                    {sessionGroups.map((group) => (
                      <section
                        key={group.id}
                        aria-labelledby={`${group.id}-registration-heading`}
                        className={`overflow-hidden rounded-xl border ${
                          errors.sessions ? "border-red-500" : "border-white/15"
                        }`}
                      >
                        <div className="flex items-baseline gap-2 border-b border-white/15 bg-white/[0.08] px-4 py-3">
                          <h3
                            id={`${group.id}-registration-heading`}
                            className="text-[16px] font-bold text-white"
                          >
                            {group.dayLabel}
                          </h3>
                          <span className="text-[13px] font-medium text-[var(--color-cyan)]">
                            {group.dateLabel}
                          </span>
                        </div>

                        {group.items.some((session) => session.kind === "common") ? (
                          <div className="border-b border-white/15 p-3 sm:p-4">
                            <p className="mb-3 text-[13px] font-bold tracking-wide text-white/65">
                              공통
                            </p>
                            <div className="flex flex-col gap-2">
                              {group.items
                                .filter((session) => session.kind === "common")
                                .map((session) => (
                                  <RegistrationSessionCheckbox
                                    key={session.id}
                                    session={session}
                                    selected={selectedSessionIds.includes(session.id)}
                                    onToggle={(sessionId, checked) =>
                                      setSelectedSessionIds((selectedIds) =>
                                        updateRegistrationSessionSelection(
                                          selectedIds,
                                          sessionId,
                                          checked
                                        )
                                      )
                                    }
                                  />
                                ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 sm:grid-cols-2">
                          {[
                            { id: "track1", label: TRACK_LABELS.track1 },
                            { id: "track2", label: TRACK_LABELS.track2 },
                          ].map((track, trackIndex) => {
                            const trackSessions = group.items.filter(
                              (session) => session.kind === track.id
                            );

                            return (
                              <div
                                key={track.id}
                                className={`p-3 sm:p-4 ${
                                  trackIndex === 1
                                    ? "border-t border-white/15 sm:border-l sm:border-t-0"
                                    : ""
                                }`}
                              >
                                <p className="mb-3 text-[13px] font-bold tracking-wide text-white/65">
                                  {track.label}
                                </p>
                                <div className="flex flex-col gap-2">
                                  {trackSessions.map((session) => (
                                    <RegistrationSessionCheckbox
                                      key={session.id}
                                      session={session}
                                      selected={selectedSessionIds.includes(session.id)}
                                      onToggle={(sessionId, checked) =>
                                        setSelectedSessionIds((selectedIds) =>
                                          updateRegistrationSessionSelection(
                                            selectedIds,
                                            sessionId,
                                            checked
                                          )
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                  <ErrorText message={errors.sessions} />
                </fieldset>

                <div className="flex flex-col gap-3 border-t border-[var(--color-line-dark)] pt-6">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-[1.8] text-white/55">
                    <p>
                      <span className="font-semibold text-white/75">수집 항목</span> ·{" "}
                      {PRIVACY_NOTICE.items}
                    </p>
                    <p>
                      <span className="font-semibold text-white/75">수집 목적</span> ·{" "}
                      {PRIVACY_NOTICE.purpose}
                    </p>
                    <p>
                      <span className="font-semibold text-white/75">보유 기간</span> ·{" "}
                      {PRIVACY_NOTICE.retention}
                    </p>
                  </div>

                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-3 text-[16px] text-white/70">
                      개인정보 수집 및 이용 동의 <span className="text-[var(--color-cyan)]">*</span>
                    </legend>
                    <div className="flex gap-3">
                      <label
                        className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border text-[16px] transition-colors duration-200 has-[:checked]:border-[var(--color-cyan)] has-[:checked]:bg-[var(--color-cyan)]/10 ${
                          errors.consent ? "border-red-500" : "border-white/15"
                        }`}
                      >
                        <input type="radio" name="consent" value="agree" className="h-4 w-4 accent-[var(--color-cyan)]" />
                        동의
                      </label>
                      <label
                        className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border text-[16px] transition-colors duration-200 has-[:checked]:border-[var(--color-cyan)] has-[:checked]:bg-[var(--color-cyan)]/10 ${
                          errors.consent ? "border-red-500" : "border-white/15"
                        }`}
                      >
                        <input
                          type="radio"
                          name="consent"
                          value="disagree"
                          className="h-4 w-4 accent-[var(--color-cyan)]"
                        />
                        미동의
                      </label>
                    </div>
                    <ErrorText message={errors.consent} />
                  </fieldset>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-glow mt-2 inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full px-8 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <CircleNotch size={18} className="animate-spin" />
                      제출 중
                    </>
                  ) : (
                    "사전등록 제출하기"
                  )}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
