import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const constantsPath = path.join(repo, "src", "lib", "constants.ts");
const programPath = path.join(repo, "src", "components", "Program.tsx");
const layoutPath = path.join(repo, "src", "app", "layout.tsx");
const constantsSource = fs.readFileSync(constantsPath, "utf8");
const programSource = fs.readFileSync(programPath, "utf8");
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
    "한국형 의료데이터 표준화의 현장 적용과 확산|김종연 대한의료정보학회 이사장",
    "AI 시대 글로벌 디지털헬스와 상호운용성 전략|양광모 교수",
    "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)|이은정 KBS 기자",
  ]);
  assert.equal(programSource.includes("좌장: {item.chair}"), true);
  assert.equal(/좌장:\s*미정|\(좌장:\s*미정\)/.test(constantsSource + programSource), false);
});

test("DAY 1 and DAY 2 render serially without tab state or hidden panels", () => {
  assert.deepEqual(constants.PROGRAM.map(({ id }) => id), ["day1", "day2"]);
  assert.match(programSource, /PROGRAM\.map\(\(d, dayIndex\) =>/);
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
  assert.match(programSource, /<section key={d\.id} aria-labelledby=/);
  assert.match(programSource, /<h3 id={`program-\$\{d\.id\}-heading`}>/);
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
      "day1|DAY 1|2026. 09. 10.(목)|09:30 – 10:25||||개회식|",
      "day1|DAY 1|2026. 09. 10.(목)|10:25 – 11:05||||기조연설|",
      "day1|DAY 1|2026. 09. 10.(목)|11:10 – 12:30|10:50 – 12:30|(80분)||국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다|디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작",
      "day1|DAY 1|2026. 09. 10.(목)|12:30 – 13:50||(80분)|점심 시간||",
      "day1|DAY 1|2026. 09. 10.(목)|13:50 – 15:30||(100분)||국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다|보건의료데이터 인프라 혁신",
      "day1|DAY 1|2026. 09. 10.(목)|15:30 – 15:50||(20분)|휴식||",
      "day1|DAY 1|2026. 09. 10.(목)|15:50 – 17:30||(100분)||의료 AI 생태계 구축|빅데이터 기반의 미래 질병 대응 전략",
      "day2|DAY 2|2026. 09. 11.(금)|10:00 – 11:40||(100분)||한국형 의료데이터 표준화의 현장 적용과 확산|비대면 진료 제도화, 의료서비스의 새로운 연결",
      "day2|DAY 2|2026. 09. 11.(금)|11:40 – 13:00||(80분)|점심 시간||",
      "day2|DAY 2|2026. 09. 11.(금)|13:00 – 14:40||(100분)||표준 기반 AI-Ready 의료시스템 실행체계|AI 시대 신뢰받는 보건의료데이터 활용 방향",
      "day2|DAY 2|2026. 09. 11.(금)|14:40 – 15:00||(20분)|휴식||",
      "day2|DAY 2|2026. 09. 11.(금)|15:00 – 16:40||(100분)||AI 시대 글로벌 디지털헬스와 상호운용성 전략|디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)",
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
      { id: "day1-10:50 – 12:30-t1", dayId: "day1", time: "11:10 – 12:30", slotKey: "day1::11:10 – 12:30", trackLabel: "Track 1 · 401호", title: "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다" },
      { id: "day1-10:50 – 12:30-t2", dayId: "day1", time: "11:10 – 12:30", slotKey: "day1::11:10 – 12:30", trackLabel: "Track 2 · 402호", title: "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작" },
      { id: "day1-13:50 – 15:30-t1", dayId: "day1", time: "13:50 – 15:30", slotKey: "day1::13:50 – 15:30", trackLabel: "Track 1 · 401호", title: "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다" },
      { id: "day1-13:50 – 15:30-t2", dayId: "day1", time: "13:50 – 15:30", slotKey: "day1::13:50 – 15:30", trackLabel: "Track 2 · 402호", title: "보건의료데이터 인프라 혁신" },
      { id: "day1-15:50 – 17:30-t1", dayId: "day1", time: "15:50 – 17:30", slotKey: "day1::15:50 – 17:30", trackLabel: "Track 1 · 401호", title: "의료 AI 생태계 구축" },
      { id: "day1-15:50 – 17:30-t2", dayId: "day1", time: "15:50 – 17:30", slotKey: "day1::15:50 – 17:30", trackLabel: "Track 2 · 402호", title: "빅데이터 기반의 미래 질병 대응 전략" },
      { id: "day2-10:00 – 11:40-t1", dayId: "day2", time: "10:00 – 11:40", slotKey: "day2::10:00 – 11:40", trackLabel: "Track 1 · 401호", title: "한국형 의료데이터 표준화의 현장 적용과 확산" },
      { id: "day2-10:00 – 11:40-t2", dayId: "day2", time: "10:00 – 11:40", slotKey: "day2::10:00 – 11:40", trackLabel: "Track 2 · 402호", title: "비대면 진료 제도화, 의료서비스의 새로운 연결" },
      { id: "day2-13:00 – 14:40-t1", dayId: "day2", time: "13:00 – 14:40", slotKey: "day2::13:00 – 14:40", trackLabel: "Track 1 · 401호", title: "표준 기반 AI-Ready 의료시스템 실행체계" },
      { id: "day2-13:00 – 14:40-t2", dayId: "day2", time: "13:00 – 14:40", slotKey: "day2::13:00 – 14:40", trackLabel: "Track 2 · 402호", title: "AI 시대 신뢰받는 보건의료데이터 활용 방향" },
      { id: "day2-15:00 – 16:40-t1", dayId: "day2", time: "15:00 – 16:40", slotKey: "day2::15:00 – 16:40", trackLabel: "Track 1 · 401호", title: "AI 시대 글로벌 디지털헬스와 상호운용성 전략" },
      { id: "day2-15:00 – 16:40-t2", dayId: "day2", time: "15:00 – 16:40", slotKey: "day2::15:00 – 16:40", trackLabel: "Track 2 · 402호", title: "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)" },
    ]
  );
});
