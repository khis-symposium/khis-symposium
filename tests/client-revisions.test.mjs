import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const constantsPath = path.join(repo, "src", "lib", "constants.ts");
const overviewPath = path.join(repo, "src", "components", "EventOverview.tsx");
const programPath = path.join(repo, "src", "components", "Program.tsx");
const registrationPath = path.join(repo, "src", "components", "Registration.tsx");
const layoutPath = path.join(repo, "src", "app", "layout.tsx");
const constantsSource = fs.readFileSync(constantsPath, "utf8");
const overviewSource = fs.readFileSync(overviewPath, "utf8");
const programSource = fs.readFileSync(programPath, "utf8");
const registrationSource = fs.readFileSync(registrationPath, "utf8");
const layoutSource = fs.readFileSync(layoutPath, "utf8");

function loadConstants() {
  const compiledExports = {};
  const compiled = ts.transpileModule(constantsSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", compiled)(compiledExports);
  return compiledExports;
}

const constants = loadConstants();
const oldTheme = "연결에서 혁신으로, 보건의료 디지털 전환의 미래";
const newTheme = "연결에서 혁신으로, 보건의료 AI 디지털 전환의 미래";

test("Hero and metadata share the single canonical AI event theme", () => {
  assert.equal(constants.EVENT_THEME, newTheme);
  assert.equal(constants.SITE.tagline, newTheme);
  assert.equal(constants.SITE.description, `${constants.SITE.name} — ${newTheme}`);
  assert.equal(constantsSource.includes(oldTheme), false);
  assert.match(layoutSource, /description: SITE\.description/);
  assert.equal((layoutSource.match(/og-image-20260819-v3\.png/g) || []).length, 2);
  assert.equal(layoutSource.includes("og-image-20260814-v2.png"), false);
});

test("the confirmed chair catalog contains exactly the eight requested entries", () => {
  const chairs = constants.PROGRAM.flatMap((day) =>
    day.slots.flatMap((slot) =>
      [slot.track1, slot.track2]
        .filter((item) => item?.chair)
        .map((item) => `${item.title}|${item.chair}`)
    )
  );

  assert.deepEqual(chairs, [
    "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다|양성일 교수",
    "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작|김일곤 대한의료정보학회장",
    "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다|이영성 교수",
    "보건의료데이터 인프라 혁신|이호영 교수",
    "의료 AI 생태계 구축|양현종 교수",
    "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)|김종엽 대한의료정보학회 이사장",
    "AI시대 글로벌 보건의료 표준과 상호운용성 전략|양광모 교수",
    "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)|이은정 KBS 기자",
  ]);
  assert.equal(constantsSource.includes(["김종", "연"].join("")), false);
  assert.equal(/좌장:\s*미정|\(좌장:\s*미정\)/.test(constantsSource), false);
});

test("overview and program components render only their supplied section images", () => {
  assert.match(overviewSource, /id="overview"/);
  assert.match(overviewSource, /src="\/images\/overview\/event-overview\.jpg"/);
  assert.match(overviewSource, /width=\{3531\}/);
  assert.match(overviewSource, /height=\{2005\}/);
  assert.doesNotMatch(overviewSource, /ROWS\.map|SectionHeading|khis-logo\.png/);

  assert.match(programSource, /id="program"/);
  assert.match(programSource, /src="\/images\/program\/program-schedule-new\.jpg"/);
  assert.match(programSource, /width=\{4961\}/);
  assert.match(programSource, /height=\{22239\}/);
  assert.doesNotMatch(programSource, /PROGRAM\.map|TrackBlock|DetailedProgram|symposium-2025/);
});

test("DAY 1 and DAY 2 data remain serial while the Program section stays image-only", () => {
  assert.deepEqual(constants.PROGRAM.map(({ id }) => id), ["day1", "day2"]);
  assert.doesNotMatch(programSource, /PROGRAM\.map/);
  for (const removedContract of [
    "useState",
    "activeDay",
    "setActiveDay",
    'role="tablist"',
    'role="tab"',
    'role="tabpanel"',
    "aria-selected",
    "aria-controls",
    "aria-hidden={!isActiveDay}",
  ]) {
    assert.equal(programSource.includes(removedContract), false, removedContract);
  }
  assert.equal(programSource.includes("onClick"), false);
  assert.doesNotMatch(programSource, /program-day1-heading|program-day2-heading/);
});

test("program registration IDs, display times, tracks, and titles remain exact", () => {
  assert.deepEqual(
    constants.PROGRAM.flatMap((day) =>
      day.slots.map((slot) =>
        [
          day.id,
          day.dayLabel,
          day.dateLabel,
          slot.time,
          slot.registrationIdTime ?? "",
          slot.duration ?? "",
          slot.shared?.title ?? "",
          slot.track1?.title ?? "",
          slot.track2?.title ?? "",
        ].join("|")
      )
    ),
    [
      "day1|DAY 1|2026. 09. 10.(목)|09:30 – 10:25|||개회식||",
      "day1|DAY 1|2026. 09. 10.(목)|10:25 – 11:05||||기조연설|",
      "day1|DAY 1|2026. 09. 10.(목)|11:10 – 12:30|10:50 – 12:30|(80분)||국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다|디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작",
      "day1|DAY 1|2026. 09. 10.(목)|12:30 – 13:50||(80분)|점심 시간||",
      "day1|DAY 1|2026. 09. 10.(목)|13:50 – 15:30||(100분)||국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다|보건의료데이터 인프라 혁신",
      "day1|DAY 1|2026. 09. 10.(목)|15:30 – 15:50||(20분)|휴식||",
      "day1|DAY 1|2026. 09. 10.(목)|15:50 – 17:30||(100분)||의료 AI 생태계 구축|빅데이터 기반의 미래 질병 대응 전략",
      "day2|DAY 2|2026. 09. 11.(금)|10:00 – 11:40||(100분)||의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)|의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상",
      "day2|DAY 2|2026. 09. 11.(금)|11:40 – 13:00||(80분)|점심 시간||",
      "day2|DAY 2|2026. 09. 11.(금)|13:00 - 14:40|13:00 – 14:40|(100분)||표준 기반 의료데이터 상호운용성 구현체계|AI 시대 신뢰받는 보건의료데이터 활용 방향",
      "day2|DAY 2|2026. 09. 11.(금)|14:40 – 15:00||(20분)|휴식||",
      "day2|DAY 2|2026. 09. 11.(금)|15:00 – 16:40||(100분)||AI시대 글로벌 보건의료 표준과 상호운용성 전략|디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)",
      "day2|DAY 2|2026. 09. 11.(금)|16:40 – 17:00||(20분)||폐회식|",
    ]
  );

  assert.deepEqual(
    constants.REGISTRATION_SESSIONS.map(({ id, dayId, time, slotKey, trackLabel, title }) => ({
      id,
      dayId,
      time,
      slotKey,
      trackLabel,
      title,
    })),
    [
      { id: "day1-09:30 – 10:25-common", dayId: "day1", time: "09:30 – 10:25", slotKey: "day1::09:30 – 10:25", trackLabel: "공통", title: "개회식" },
      { id: "day1-10:50 – 12:30-t1", dayId: "day1", time: "11:10 – 12:30", slotKey: "day1::11:10 – 12:30", trackLabel: "Track 1 · 401호", title: "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다" },
      { id: "day1-10:50 – 12:30-t2", dayId: "day1", time: "11:10 – 12:30", slotKey: "day1::11:10 – 12:30", trackLabel: "Track 2 · 402호", title: "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작" },
      { id: "day1-13:50 – 15:30-t1", dayId: "day1", time: "13:50 – 15:30", slotKey: "day1::13:50 – 15:30", trackLabel: "Track 1 · 401호", title: "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다" },
      { id: "day1-13:50 – 15:30-t2", dayId: "day1", time: "13:50 – 15:30", slotKey: "day1::13:50 – 15:30", trackLabel: "Track 2 · 402호", title: "보건의료데이터 인프라 혁신" },
      { id: "day1-15:50 – 17:30-t1", dayId: "day1", time: "15:50 – 17:30", slotKey: "day1::15:50 – 17:30", trackLabel: "Track 1 · 401호", title: "의료 AI 생태계 구축" },
      { id: "day1-15:50 – 17:30-t2", dayId: "day1", time: "15:50 – 17:30", slotKey: "day1::15:50 – 17:30", trackLabel: "Track 2 · 402호", title: "빅데이터 기반의 미래 질병 대응 전략" },
      { id: "day2-10:00 – 11:40-t1", dayId: "day2", time: "10:00 – 11:40", slotKey: "day2::10:00 – 11:40", trackLabel: "Track 1 · 401호", title: "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)" },
      { id: "day2-10:00 – 11:40-t2", dayId: "day2", time: "10:00 – 11:40", slotKey: "day2::10:00 – 11:40", trackLabel: "Track 2 · 402호", title: "의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상" },
      { id: "day2-13:00 – 14:40-t1", dayId: "day2", time: "13:00 - 14:20", slotKey: "day2::13:00 - 14:40", trackLabel: "Track 1 · 401호", title: "표준 기반 의료데이터 상호운용성 구현체계" },
      { id: "day2-13:00 – 14:40-t2", dayId: "day2", time: "13:00 - 14:40", slotKey: "day2::13:00 - 14:40", trackLabel: "Track 2 · 402호", title: "AI 시대 신뢰받는 보건의료데이터 활용 방향" },
      { id: "day2-15:00 – 16:40-t1", dayId: "day2", time: "14:40 ~ 16:40", slotKey: "day2::15:00 – 16:40", trackLabel: "Track 1 · 401호", title: "AI시대 글로벌 보건의료 표준과 상호운용성 전략" },
      { id: "day2-15:00 – 16:40-t2", dayId: "day2", time: "15:00 – 16:40", slotKey: "day2::15:00 – 16:40", trackLabel: "Track 2 · 402호", title: "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)" },
    ]
  );

  const openingOptions = constants.REGISTRATION_SESSIONS.filter(
    (session) => session.title === "개회식"
  );
  assert.equal(constants.REGISTRATION_SESSIONS.length, 13);
  assert.deepEqual(openingOptions, [
    {
      id: "day1-09:30 – 10:25-common",
      dayId: "day1",
      dayLabel: "DAY 1",
      time: "09:30 – 10:25",
      slotKey: "day1::09:30 – 10:25",
      kind: "common",
      trackLabel: "공통",
      title: "개회식",
    },
  ]);
});

test("confirmed DAY 2 content feeds registration labels while stable payload IDs remain", () => {
  const day2 = constants.PROGRAM.find((day) => day.id === "day2");
  assert.ok(day2);

  const parallelSlots = day2.slots.filter((slot) => slot.track1 && slot.track2);
  assert.deepEqual(
    parallelSlots.map((slot) => ({
      time: slot.time,
      registrationIdTime: slot.registrationIdTime ?? slot.time,
      track1Time: slot.track1.time ?? slot.time,
      track1Duration: slot.track1.duration ?? slot.duration,
      track2Time: slot.track2.time ?? slot.time,
      track2Duration: slot.track2.duration ?? slot.duration,
      track1: slot.track1.title,
      track2: slot.track2.title,
    })),
    [
      {
        time: "10:00 – 11:40",
        registrationIdTime: "10:00 – 11:40",
        track1Time: "10:00 – 11:40",
        track1Duration: "(100분)",
        track2Time: "10:00 – 11:40",
        track2Duration: "(100분)",
        track1: "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)",
        track2: "의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상",
      },
      {
        time: "13:00 - 14:40",
        registrationIdTime: "13:00 – 14:40",
        track1Time: "13:00 - 14:20",
        track1Duration: "(80분)",
        track2Time: "13:00 - 14:40",
        track2Duration: "(100분)",
        track1: "표준 기반 의료데이터 상호운용성 구현체계",
        track2: "AI 시대 신뢰받는 보건의료데이터 활용 방향",
      },
      {
        time: "15:00 – 16:40",
        registrationIdTime: "15:00 – 16:40",
        track1Time: "14:40 ~ 16:40",
        track1Duration: "(120분)",
        track2Time: "15:00 – 16:40",
        track2Duration: "(100분)",
        track1: "AI시대 글로벌 보건의료 표준과 상호운용성 전략",
        track2: "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)",
      },
    ]
  );

  const day2Registration = constants.REGISTRATION_SESSIONS.filter(
    (session) => session.dayId === "day2"
  );
  assert.equal(constants.REGISTRATION_SESSIONS.length, 13);
  assert.deepEqual(
    day2Registration.map(({ id }) => id),
    [
      "day2-10:00 – 11:40-t1",
      "day2-10:00 – 11:40-t2",
      "day2-13:00 – 14:40-t1",
      "day2-13:00 – 14:40-t2",
      "day2-15:00 – 16:40-t1",
      "day2-15:00 – 16:40-t2",
    ]
  );

  const parallelSecondSlot = day2Registration.filter(
    ({ id }) => id === "day2-13:00 – 14:40-t1" || id === "day2-13:00 – 14:40-t2"
  );
  assert.deepEqual(
    parallelSecondSlot.map(({ id, time, slotKey }) => ({ id, time, slotKey })),
    [
      {
        id: "day2-13:00 – 14:40-t1",
        time: "13:00 - 14:20",
        slotKey: "day2::13:00 - 14:40",
      },
      {
        id: "day2-13:00 – 14:40-t2",
        time: "13:00 - 14:40",
        slotKey: "day2::13:00 - 14:40",
      },
    ]
  );
  assert.equal(constants.hasRegistrationSessionSlotConflict(parallelSecondSlot.map(({ id }) => id)), true);

  const parallelFinalSlot = day2Registration.filter(
    ({ id }) => id === "day2-15:00 – 16:40-t1" || id === "day2-15:00 – 16:40-t2"
  );
  assert.deepEqual(
    parallelFinalSlot.map(({ id, time, slotKey }) => ({ id, time, slotKey })),
    [
      {
        id: "day2-15:00 – 16:40-t1",
        time: "14:40 ~ 16:40",
        slotKey: "day2::15:00 – 16:40",
      },
      {
        id: "day2-15:00 – 16:40-t2",
        time: "15:00 – 16:40",
        slotKey: "day2::15:00 – 16:40",
      },
    ]
  );
  assert.equal(
    constants.hasRegistrationSessionSlotConflict(parallelFinalSlot.map(({ id }) => id)),
    true
  );
  let finalSlotSelection = constants.updateRegistrationSessionSelection(
    [],
    parallelFinalSlot[1].id,
    true
  );
  finalSlotSelection = constants.updateRegistrationSessionSelection(
    finalSlotSelection,
    parallelFinalSlot[0].id,
    true
  );
  assert.deepEqual(finalSlotSelection, ["day2-15:00 – 16:40-t1"]);

  const revisedSession = day2Registration.find(
    ({ id }) => id === "day2-13:00 – 14:40-t1"
  );
  assert.ok(revisedSession);
  const selectedIds = constants.updateRegistrationSessionSelection(
    [],
    revisedSession.id,
    true
  );
  assert.deepEqual(selectedIds, [revisedSession.id]);
  assert.deepEqual(
    day2Registration
      .filter(({ id }) => selectedIds.includes(id))
      .map(({ time, title }) => ({ time, title })),
    [
      {
        time: "13:00 - 14:20",
        title: "표준 기반 의료데이터 상호운용성 구현체계",
      },
    ]
  );

  assert.match(registrationSource, /\{session\.time\}/);
  assert.match(registrationSource, /\{session\.title\}/);
  assert.match(registrationSource, /selectedSessionIds\.includes\(session\.id\)/);
  for (const oldValue of [
    "한국형 의료데이터 표준화의 현장 적용과 확산",
    "비대면 진료 제도화, 의료서비스의 새로운 연결",
    "표준 기반 AI-Ready 의료시스템 실행체계",
    "AI 시대 글로벌 디지털헬스와 상호운용성 전략",
  ]) {
    assert.equal(constantsSource.includes(oldValue), false, oldValue);
  }
});
