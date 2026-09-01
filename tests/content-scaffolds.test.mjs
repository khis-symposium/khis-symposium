import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSource(file) {
  return fs.readFileSync(path.join(repo, file), "utf8");
}

function transpile(file) {
  return ts.transpileModule(readSource(file), {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function loadModule(file, requireModule = () => {
  throw new Error("Unexpected import");
}) {
  const compiledExports = {};
  new Function("exports", "require", transpile(file))(compiledExports, requireModule);
  return compiledExports;
}

const speakersData = loadModule(path.join("src", "data", "speakers.ts"));
const detailedProgramData = loadModule(
  path.join("src", "data", "detailed-program.ts")
);
const constants = loadModule(path.join("src", "lib", "constants.ts"));

function Container({ children, className = "" }) {
  return React.createElement("div", { className }, children);
}

function Reveal({ children, className = "", as = "div" }) {
  return React.createElement(as, { className }, children);
}

function SectionHeading({ eyebrow, title, description, titleId }) {
  return React.createElement(
    "div",
    null,
    React.createElement("span", null, eyebrow),
    React.createElement("h2", { id: titleId }, title),
    description ? React.createElement("p", null, description) : null
  );
}

function ImageComponent(props) {
  const imageProps = { ...props };
  delete imageProps.sizes;
  return React.createElement("img", imageProps);
}

function Icon() {
  return React.createElement("svg", { "aria-hidden": "true" });
}

const speakersModule = loadModule(
  path.join("src", "components", "Speakers.tsx"),
  (specifier) => {
    if (specifier === "react/jsx-runtime") return jsxRuntime;
    if (specifier === "next/image") return ImageComponent;
    if (specifier === "./ui/Container") return { Container };
    if (specifier === "./ui/Reveal") return { Reveal };
    if (specifier === "./ui/SectionHeading") return { SectionHeading };
    if (specifier === "@/data/speakers") return speakersData;
    throw new Error(`Unexpected Speakers import: ${specifier}`);
  }
);

const detailedProgramModule = loadModule(
  path.join("src", "components", "DetailedProgram.tsx"),
  (specifier) => {
    if (specifier === "react/jsx-runtime") return jsxRuntime;
    if (specifier === "next/image") return ImageComponent;
    if (specifier === "@phosphor-icons/react/dist/ssr") {
      return { ArrowSquareOut: Icon };
    }
    if (specifier === "@/data/detailed-program") return detailedProgramData;
    if (specifier === "./ui/Reveal") return { Reveal };
    throw new Error(`Unexpected DetailedProgram import: ${specifier}`);
  }
);

const speakerFixtures = [
  {
    id: "fixture-day1-chair",
    dayId: "day1",
    sessionId: "day1-track1-a1",
    sessionTitle: "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다",
    role: "좌장",
    name: "테스트 좌장",
    affiliation: "테스트용 매우 긴 보건의료 데이터 상호운용성 연구기관",
    title: "디지털 헬스 정책 및 의료정보 표준화 연구센터 수석연구위원",
    imageSrc: "",
    imageAlt: "",
  },
  {
    id: "fixture-day1-speaker",
    dayId: "day1",
    sessionId: "day1-track1-a1",
    sessionTitle: "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다",
    role: "연사",
    name: "Test Speaker",
    affiliation: "테스트 국제 디지털헬스 협력기구",
    title: "프로그램 디렉터",
    imageSrc: "/images/speakers/fixture-speaker.webp",
    imageAlt: "Test Speaker 테스트 프로필 이미지",
  },
  {
    id: "fixture-day1-panel",
    dayId: "day1",
    sessionId: "day1-track1-a1",
    sessionTitle: "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다",
    role: "패널",
    name: "테스트 패널",
    affiliation: "테스트 의료기관",
    title: "의료정보실장",
    imageSrc: "",
    imageAlt: "",
  },
  {
    id: "fixture-day2-speaker",
    dayId: "day2",
    sessionId: "day2-track1-a4",
    sessionTitle: "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)",
    role: "연사",
    name: "DAY 2 테스트 연사",
    affiliation: "테스트 공공기관",
    title: "책임연구원",
    imageSrc: "",
    imageAlt: "",
  },
];

const detailedProgramFixture = {
  src: "/images/test-only-detailed-program.webp",
  alt: "테스트 상세 프로그램 전체 일정",
  width: 1600,
  height: 2400,
};

function renderSpeakers(props) {
  return renderToStaticMarkup(
    React.createElement(speakersModule.Speakers, props)
  );
}

function renderDetailedProgram(props) {
  return renderToStaticMarkup(
    React.createElement(detailedProgramModule.DetailedProgram, props)
  );
}

test("speaker navigation and section stay absent when publication is false", () => {
  assert.deepEqual(
    constants.getNavigationLinks(false).map(({ label }) => label),
    ["행사 개요", "프로그램", "오시는 길"]
  );
  assert.equal(renderSpeakers({ published: false, speakers: speakerFixtures }), "");
});

test("speaker data must be present and complete even when publication is true", () => {
  assert.equal(renderSpeakers({ published: true, speakers: [] }), "");
  assert.equal(
    speakersData.isSpeakerSectionPublished(true, [
      { ...speakerFixtures[0], affiliation: "" },
      speakerFixtures[3],
    ]),
    false
  );
  assert.equal(
    speakersData.isSpeakerSectionPublished(true, speakerFixtures.slice(0, 3)),
    false,
    "publishing only DAY 1 would leave the required DAY 2 structure empty"
  );
});

test("valid fixtures expose navigation and the complete speaker section together", () => {
  assert.equal(
    speakersData.isSpeakerSectionPublished(true, speakerFixtures),
    true
  );
  assert.deepEqual(
    constants.getNavigationLinks(true).map(({ label, href }) => `${label}|${href}`),
    [
      "행사 개요|#overview",
      "프로그램|#program",
      "연사 소개|#speakers",
      "오시는 길|#location",
    ]
  );

  const markup = renderSpeakers({ published: true, speakers: speakerFixtures });
  assert.match(markup, /id="speakers"/);
  assert.match(markup, /aria-labelledby="speakers-heading"/);
  assert.match(markup, /scroll-mt-24/);
  assert.match(markup, /id="speakers-heading"/);
  assert.match(markup, />연사 소개</);
});

test("DAY 1 and DAY 2 are serial in the initial speaker markup without tabs", () => {
  const markup = renderSpeakers({ published: true, speakers: speakerFixtures });
  assert.ok(markup.indexOf("DAY 1") < markup.indexOf("DAY 2"));
  assert.match(markup, /id="speakers-day1"/);
  assert.match(markup, /id="speakers-day2"/);

  const speakerSource = readSource(path.join("src", "components", "Speakers.tsx"));
  for (const forbiddenState of [
    "useState",
    "activeDay",
    "setActiveDay",
    'role="tablist"',
    'role="tab"',
    'role="tabpanel"',
    "aria-selected",
  ]) {
    assert.equal(speakerSource.includes(forbiddenState), false, forbiddenState);
  }
});

test("speaker hierarchy renders day, session, role, name, affiliation, and title", () => {
  const markup = renderSpeakers({ published: true, speakers: speakerFixtures });
  for (const expectedText of [
    "DAY 1",
    "DAY 2",
    speakerFixtures[0].sessionTitle,
    speakerFixtures[3].sessionTitle,
    "Track 1 · 401호",
    "좌장",
    "연사",
    "패널",
    speakerFixtures[0].name,
    speakerFixtures[0].affiliation,
    speakerFixtures[0].title,
  ]) {
    assert.ok(markup.includes(expectedText), expectedText);
  }

  const h2 = markup.indexOf("<h2");
  const h3 = markup.indexOf("<h3");
  const h4 = markup.indexOf("<h4");
  const h5 = markup.indexOf("<h5");
  assert.ok(h2 >= 0 && h2 < h3 && h3 < h4 && h4 < h5);
  assert.match(markup, /alt="Test Speaker 테스트 프로필 이미지"/);
});

test("speaker cards provide no profile, biography, modal, search, or detail controls", () => {
  const markup = renderSpeakers({ published: true, speakers: speakerFixtures });
  assert.doesNotMatch(markup, /<button\b/i);
  assert.doesNotMatch(markup, /상세(?:보기|프로필)|약력|돋보기|modal|drawer/i);
  assert.equal((markup.match(/<article\b/g) || []).length, speakerFixtures.length);
  assert.equal((markup.match(/<a\b/g) || []).length, 2, "only DAY anchor shortcuts are links");
});

test("detailed program remains absent unless both flag and valid asset exist", () => {
  assert.equal(
    renderDetailedProgram({ published: false, asset: detailedProgramFixture }),
    ""
  );
  assert.equal(renderDetailedProgram({ published: true, asset: null }), "");
  assert.equal(
    renderDetailedProgram({
      published: true,
      asset: { ...detailedProgramFixture, width: 0 },
    }),
    ""
  );
});

test("a valid detailed program fixture renders full image metadata and original link", () => {
  const markup = renderDetailedProgram({
    published: true,
    asset: detailedProgramFixture,
  });
  assert.match(markup, /<h3[^>]*>상세 프로그램<\/h3>/);
  assert.match(markup, /src="\/images\/test-only-detailed-program\.webp"/);
  assert.match(markup, /alt="테스트 상세 프로그램 전체 일정"/);
  assert.match(markup, /width="1600"/);
  assert.match(markup, /height="2400"/);
  assert.match(markup, /style="width:100%;height:auto"/);
  assert.match(markup, /object-contain/);
  assert.match(markup, /href="\/images\/test-only-detailed-program\.webp"/);
  assert.match(markup, />원본 이미지 크게 보기/);
});

test("page order and shared gates keep speaker UI between program and location", () => {
  const pageSource = readSource(path.join("src", "app", "page.tsx"));
  const headerSource = readSource(path.join("src", "components", "Header.tsx"));
  const programSource = readSource(path.join("src", "components", "Program.tsx"));

  assert.ok(pageSource.indexOf("<Program />") < pageSource.indexOf("<Speakers "));
  assert.ok(pageSource.indexOf("<Speakers ") < pageSource.indexOf("<Location />"));
  assert.ok(pageSource.indexOf("<Location />") < pageSource.indexOf("<Registration />"));
  assert.match(pageSource, /<Header showSpeakers=\{SPEAKERS_VISIBLE\}/);
  assert.equal((headerSource.match(/navigationLinks\.map/g) || []).length, 2);
  assert.doesNotMatch(programSource, /DetailedProgram/);
});

test("committed defaults publish verified speakers but no detailed-program placeholder", () => {
  assert.equal(speakersData.SPEAKERS_PUBLISHED, true);
  assert.equal(speakersData.SPEAKERS.length, 67);
  assert.equal(speakersData.SPEAKERS_VISIBLE, true);
  assert.equal(detailedProgramData.DETAILED_PROGRAM_PUBLISHED, false);
  assert.equal(detailedProgramData.DETAILED_PROGRAM_ASSET, null);
  assert.match(renderSpeakers({}), /id="speakers"/);
  assert.equal(renderDetailedProgram({}), "");
});
