import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  {
    file: path.join("public", "images", "overview", "event-overview.jpg"),
    width: 3531,
    height: 2005,
    sha256: "fde61235985cd33f8cb8489804888058f20ee1750515bcbeedb01eabe95861c6",
  },
  {
    file: path.join("public", "images", "program", "program-schedule-new-new-new-new-new.jpg"),
    width: 4961,
    height: 29643,
    sha256: "ffc67ca2f399fee979fdbb2874451d669f379339a43e5d309f3e894d4f2f9123",
  },
];

function jpegDimensions(buffer) {
  assert.deepEqual([...buffer.subarray(0, 3)], [0xff, 0xd8, 0xff]);

  for (let offset = 2; offset + 9 < buffer.length; ) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;

    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found");
}

function loadComponent(file) {
  const source = fs.readFileSync(path.join(repo, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiledExports = {};

  function Container({ children, className = "" }) {
    return React.createElement(
      "div",
      { className: `container-symposium ${className}`.trim() },
      children
    );
  }

  function ImageComponent(props) {
    return React.createElement("img", props);
  }

  new Function("exports", "require", compiled)(compiledExports, (specifier) => {
    if (specifier === "react/jsx-runtime") return jsxRuntime;
    if (specifier === "next/image") return ImageComponent;
    if (specifier === "./ui/Container") return { Container };
    throw new Error(`Unexpected import: ${specifier}`);
  });

  return compiledExports;
}

test("section image files remain byte-identical JPEG assets with exact dimensions", () => {
  for (const asset of assets) {
    const absolutePath = path.join(repo, asset.file);
    const buffer = fs.readFileSync(absolutePath);
    assert.equal(path.extname(absolutePath), ".jpg");
    assert.deepEqual(jpegDimensions(buffer), {
      width: asset.width,
      height: asset.height,
    });
    assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), asset.sha256);
  }
});

test("overview section renders one complete image and no legacy visible content", () => {
  const { EventOverview } = loadComponent(
    path.join("src", "components", "EventOverview.tsx")
  );
  const markup = renderToStaticMarkup(React.createElement(EventOverview));

  assert.match(markup, /<section[^>]*id="overview"/);
  assert.match(markup, /<h2[^>]*class="sr-only"[^>]*>행사 개요<\/h2>/);
  assert.equal((markup.match(/<img\b/g) || []).length, 1);
  assert.match(markup, /src="\/images\/overview\/event-overview\.jpg"/);
  assert.match(markup, /width="3531"/);
  assert.match(markup, /height="2005"/);
  assert.match(
    markup,
    /alt="2026 한국보건의료정보원 연례 심포지엄\. 연결에서 혁신으로, 보건의료 AI 디지털 전환의 미래\. 2026년 9월 10일 목요일부터 11일 금요일까지 서울 강남 코엑스 컨퍼런스룸 401·402에서 개최\."/
  );
  assert.match(markup, /class="block h-auto w-full object-contain"/);
  assert.match(
    markup,
    /sizes="\(max-width: 767px\) calc\(100vw - 3rem\), \(max-width: 1199px\) calc\(100vw - 5rem\), 1120px"/
  );
  assert.match(markup, /<section[^>]*class="m-0 scroll-mt-24 p-0"/);
  assert.match(markup, /<div class="container-symposium">/);
  assert.doesNotMatch(markup, /section-pad|grain-overlay|linear-gradient|background|border|shadow|rounded/);
  assert.doesNotMatch(markup, /<h3\b|주최‧주관|khis-logo\.png/);
});

test("program section renders one schedule image and no structured schedule UI", () => {
  const { Program } = loadComponent(path.join("src", "components", "Program.tsx"));
  const markup = renderToStaticMarkup(React.createElement(Program));

  assert.match(markup, /<section[^>]*id="program"/);
  assert.match(markup, /<h2[^>]*class="sr-only"[^>]*>프로그램<\/h2>/);
  assert.equal((markup.match(/<img\b/g) || []).length, 1);
  assert.match(markup, /src="\/images\/program\/program-schedule-new-new-new-new-new\.jpg"/);
  assert.match(markup, /width="4961"/);
  assert.match(markup, /height="29643"/);
  assert.match(
    markup,
    /alt="2026 한국보건의료정보원 연례 심포지엄 전체 프로그램 일정표\. 9월 10일과 11일, 코엑스 401호·402호의 세션별 시간, 발표와 토론 일정\."/
  );
  assert.match(markup, /class="block h-auto w-full object-contain"/);
  assert.match(
    markup,
    /sizes="\(max-width: 767px\) calc\(100vw - 3rem\), \(max-width: 1199px\) calc\(100vw - 5rem\), 1120px"/
  );
  assert.match(markup, /<section[^>]*class="m-0 scroll-mt-24 p-0"/);
  assert.match(markup, /<div class="container-symposium">/);
  assert.doesNotMatch(markup, /section-pad|on-light|max-w-|background|border|shadow|rounded/);
  assert.doesNotMatch(
    markup,
    /DAY 1|DAY 2|Track 1|Track 2|상세 프로그램|원본 이미지 크게 보기|리플렛 다운로드/
  );
});

test("overview and program remain adjacent navigation-width sections without visible separators", () => {
  const pageSource = fs.readFileSync(path.join(repo, "src", "app", "page.tsx"), "utf8");
  const overviewSource = fs.readFileSync(
    path.join(repo, "src", "components", "EventOverview.tsx"),
    "utf8"
  );
  const programSource = fs.readFileSync(
    path.join(repo, "src", "components", "Program.tsx"),
    "utf8"
  );

  assert.match(pageSource, /<EventOverview \/>\s*<Program \/>/);
  for (const source of [overviewSource, programSource]) {
    assert.match(source, /className="m-0 scroll-mt-24 p-0"/);
    assert.match(source, /className="sr-only"/);
    assert.match(source, /<Container>/);
    assert.match(
      source,
      /sizes="\(max-width: 767px\) calc\(100vw - 3rem\), \(max-width: 1199px\) calc\(100vw - 5rem\), 1120px"/
    );
    assert.match(source, /className="block h-auto w-full object-contain"/);
    assert.doesNotMatch(source, /section-pad|on-light|grain-overlay|max-w-|linear-gradient|bg-\[/);
  }
});
