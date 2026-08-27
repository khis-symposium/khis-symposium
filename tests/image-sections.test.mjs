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
    height: 1878,
    sha256: "3edf9cf87130a68eb84ddfdfbb528bc2ed88e96491531c2338e338502b2143c2",
  },
  {
    file: path.join("public", "images", "program", "program-schedule.jpg"),
    width: 4961,
    height: 19910,
    sha256: "936e1757338bb3c3340d3375f8e2c3e700366d2d50e813788e6719f860b337fa",
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
    return React.createElement("div", { className }, children);
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
  assert.match(markup, /height="1878"/);
  assert.match(
    markup,
    /alt="2026 한국보건의료정보원 연례 심포지엄\. 연결에서 혁신으로, 보건의료 AI 디지털 전환의 미래\. 2026년 9월 10일 목요일부터 11일 금요일까지 서울 강남 코엑스 컨퍼런스룸 401·402에서 개최\."/
  );
  assert.match(markup, /class="block h-auto w-full object-contain"/);
  assert.doesNotMatch(markup, /<h3\b|주최‧주관|khis-logo\.png/);
});

test("program section renders one schedule image and no structured schedule UI", () => {
  const { Program } = loadComponent(path.join("src", "components", "Program.tsx"));
  const markup = renderToStaticMarkup(React.createElement(Program));

  assert.match(markup, /<section[^>]*id="program"/);
  assert.match(markup, /<h2[^>]*class="sr-only"[^>]*>프로그램<\/h2>/);
  assert.equal((markup.match(/<img\b/g) || []).length, 1);
  assert.match(markup, /src="\/images\/program\/program-schedule\.jpg"/);
  assert.match(markup, /width="4961"/);
  assert.match(markup, /height="19910"/);
  assert.match(
    markup,
    /alt="2026 한국보건의료정보원 연례 심포지엄 전체 프로그램 일정표\. 9월 10일과 11일, 코엑스 401호·402호의 세션별 시간, 발표와 토론 일정\."/
  );
  assert.match(markup, /class="block h-auto w-full object-contain"/);
  assert.doesNotMatch(
    markup,
    /DAY 1|DAY 2|Track 1|Track 2|상세 프로그램|원본 이미지 크게 보기|리플렛 다운로드/
  );
});
