"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import {
  ATTENDANCE_DAY_OPTIONS,
  REFERRAL_OPTIONS,
  REGISTRATION_NOTE,
} from "@/lib/constants";

type Status = "idle" | "submitting" | "success" | "error";

const fieldBase =
  "w-full min-h-[44px] rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-[16px] text-white outline-none transition-colors duration-200 placeholder:text-white/35 focus:border-[var(--color-cyan)]";

const labelBase = "text-[16px] font-medium text-white/70";

export function Registration() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    // NOTE: 실제 등록 처리(백엔드 연동)는 폼 필드 확정 후 연결 예정입니다.
    // 지금은 제출 흐름과 상태 피드백만 시연합니다.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("success");
  }

  return (
    <section id="register" className="section-pad bg-[var(--color-bg-deep)] text-white">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-24">
          <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">REGISTRATION</span>
            <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-[1.3] tracking-tight">
              사전등록
            </h2>
            <div className="rule-accent" />
            <p className="max-w-md text-[16px] leading-[1.9] text-white/70">
              심포지엄은 참가비 없이 사전등록을 통해 참여하실 수 있습니다. 등록 마감 전
              신청해 주시기 바랍니다.
            </p>
            <p className="mt-2 text-[16px] text-white/40">{REGISTRATION_NOTE}</p>
          </Reveal>

          <Reveal delay={100}>
            {status === "success" ? (
              <div className="flex flex-col items-start gap-4 rounded-[12px] border border-[var(--color-cyan)]/25 bg-white/[0.04] p-10">
                <CheckCircle size={36} weight="fill" className="text-[var(--color-cyan)]" />
                <h3 className="text-xl font-bold">사전등록이 접수되었습니다</h3>
                <p className="text-[16px] leading-[1.8] text-white/70">
                  입력하신 이메일로 확인 안내를 보내드릴 예정입니다. 심포지엄에서 뵙기를
                  기대합니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className={labelBase}>
                      성명 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="홍길동"
                      className={fieldBase}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="org" className={labelBase}>
                      소속기관 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="org"
                      name="org"
                      type="text"
                      required
                      autoComplete="organization"
                      placeholder="예) 한국보건의료정보원"
                      className={fieldBase}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="position" className={labelBase}>
                      부서 / 직위
                    </label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      autoComplete="organization-title"
                      placeholder="예) 데이터정책팀 · 팀장"
                      className={fieldBase}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className={labelBase}>
                      휴대전화 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="010-0000-0000"
                      className={fieldBase}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="email" className={labelBase}>
                      이메일 <span className="text-[var(--color-cyan)]">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@example.com"
                      className={fieldBase}
                    />
                  </div>
                </div>

                <fieldset className="flex flex-col gap-3">
                  <legend className={labelBase}>
                    참석일자 <span className="text-[var(--color-cyan)]">*</span>
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {ATTENDANCE_DAY_OPTIONS.map((opt, i) => (
                      <label
                        key={opt.id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-full border border-white/15 px-4 py-2 text-[16px] text-white/85 transition-colors duration-200 has-[:checked]:border-[var(--color-cyan)] has-[:checked]:bg-[var(--color-cyan)]/10"
                      >
                        <input
                          type="radio"
                          name="attendanceDay"
                          value={opt.id}
                          required
                          defaultChecked={i === 0}
                          className="h-4 w-4 accent-[var(--color-cyan)]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-col gap-2">
                  <label htmlFor="referral" className={labelBase}>
                    참가경로
                  </label>
                  <select id="referral" name="referral" className={`${fieldBase} appearance-none`}>
                    {REFERRAL_OPTIONS.map((opt) => (
                      // Native <option> popups render on the OS's own (usually light)
                      // surface regardless of page theme — force a dark, fixed color
                      // here rather than the (now white) --color-ink token.
                      <option key={opt} value={opt} className="text-slate-900">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 text-[16px] leading-[1.7] text-white/70">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-cyan)]"
                  />
                  <span>
                    개인정보 수집 및 이용에 동의합니다. 수집된 정보는 심포지엄 등록 및
                    안내 목적으로만 사용되며, 행사 종료 후 관련 법령에 따라 파기됩니다.
                    <span className="text-[var(--color-cyan)]"> *</span>
                  </span>
                </label>

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
