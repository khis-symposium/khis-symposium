import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(
  path.join(repo, "apps-script", "registration", "Code.gs"),
  "utf8"
);
const VALID_TOKEN = "A".repeat(43);
const WRONG_TOKEN = "B".repeat(43);
const EXPECTED_HEADERS = [
  "타임스탬프",
  "성명",
  "소속분류",
  "소속명",
  "직위",
  "연락처",
  "이메일",
  "참여세션",
  "동의여부",
];

function loadSiteConstants() {
  const source = fs.readFileSync(path.join(repo, "src", "lib", "constants.ts"), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiledExports = {};
  new Function("exports", javascript)(compiledExports);
  return {
    affiliations: [...compiledExports.AFFILIATION_TYPES],
    sessions: compiledExports.REGISTRATION_SESSIONS.map((session) => session.id),
  };
}

function extractArray(name) {
  const match = code.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  assert.ok(match, `${name} declaration must exist`);
  return vm.runInNewContext(match[1]);
}

const siteContract = loadSiteConstants();

function validPayload() {
  return {
    name: "로컬 회귀 테스트",
    affiliationType: siteContract.affiliations[0],
    orgName: "가상 테스트 기관",
    position: "테스터",
    phone: "010-0000-0000",
    email: "local-test@example.invalid",
    sessions: [siteContract.sessions[0]],
    consent: "agree",
    authToken: VALID_TOKEN,
  };
}

function createHarness(options = {}) {
  const state = {
    propertyReads: 0,
    spreadsheetAccesses: 0,
    requestedSheetNames: [],
    activeSheetAccesses: 0,
    headerReads: 0,
    formatCalls: [],
    writes: [],
    flushes: 0,
    lockAttempts: [],
    lockReleases: 0,
    responses: [],
    logs: [],
    events: [],
  };
  const headers = options.headers || EXPECTED_HEADERS;
  const sheet = options.sheetMissing
    ? null
    : {
        getRange(row, column, rows, columns) {
          if (row === 1 && column === 1 && rows === 1 && columns === 9) {
            return {
              getValues() {
                state.headerReads += 1;
                state.events.push("headers");
                return [[...headers]];
              },
            };
          }
          return {
            setNumberFormat(format) {
              state.formatCalls.push({ row, column, rows, columns, format });
              state.events.push("format");
              return this;
            },
            setValues(values) {
              state.events.push("write");
              if (options.setValuesThrows) throw new Error("mock write failure");
              state.writes.push({ row, column, rows, columns, values });
              return this;
            },
          };
        },
        getLastRow() {
          return 3;
        },
      };

  const context = {
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput(content) {
        state.responses.push(content);
        state.events.push(`response:${content}`);
        return {
          content,
          mimeType: null,
          setMimeType(mimeType) {
            this.mimeType = mimeType;
            return this;
          },
        };
      },
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock(timeout) {
            state.lockAttempts.push(timeout);
            state.events.push("lock");
            return options.lockAcquired !== false;
          },
          releaseLock() {
            state.lockReleases += 1;
            state.events.push("unlock");
          },
        };
      },
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            state.propertyReads += 1;
            assert.equal(name, "REGISTRATION_UPSTREAM_TOKEN");
            return Object.prototype.hasOwnProperty.call(options, "propertyToken")
              ? options.propertyToken
              : VALID_TOKEN;
          },
        };
      },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state.spreadsheetAccesses += 1;
        state.events.push("spreadsheet");
        return {
          getSheetByName(name) {
            state.requestedSheetNames.push(name);
            return sheet;
          },
          getActiveSheet() {
            state.activeSheetAccesses += 1;
            throw new Error("getActiveSheet must not be used");
          },
        };
      },
      flush() {
        state.events.push("flush");
        if (options.flushThrows) throw new Error("mock flush failure");
        state.flushes += 1;
      },
    },
    Utilities: {
      Charset: { UTF_8: "UTF_8" },
      DigestAlgorithm: { SHA_256: "SHA_256" },
      newBlob(value) {
        return { getBytes: () => [...Buffer.from(value, "utf8")] };
      },
      computeDigest(algorithm, value, charset) {
        assert.equal(algorithm, "SHA_256");
        assert.equal(charset, "UTF_8");
        return [...crypto.createHash("sha256").update(value, "utf8").digest()];
      },
    },
    console: {
      log: (...values) => state.logs.push(values),
      error: (...values) => state.logs.push(values),
      warn: (...values) => state.logs.push(values),
    },
    Logger: { log: (...values) => state.logs.push(values) },
  };
  vm.createContext(context);
  vm.runInContext(code, context, { filename: "Code.gs" });

  function invoke(value = validPayload(), raw) {
    const contents = raw === undefined ? JSON.stringify(value) : raw;
    const response = context.doPost({ postData: { contents } });
    return JSON.parse(response.content);
  }

  return { context, invoke, state };
}

function assertRejected(harness, value, raw) {
  assert.deepEqual(harness.invoke(value, raw), { result: "error" });
  assert.equal(harness.state.writes.length, 0);
}

test("Apps Script and Next constants use identical affiliations and session IDs", () => {
  assert.deepEqual([...extractArray("ALLOWED_AFFILIATIONS_")], siteContract.affiliations);
  assert.equal(siteContract.affiliations[0], "정부부처");
  assert.ok(!siteContract.affiliations.includes("정보부처"));
  assert.deepEqual([...extractArray("ALLOWED_SESSIONS_")], siteContract.sessions);
  assert.deepEqual([...extractArray("EXPECTED_HEADERS_")], EXPECTED_HEADERS);
});

test("valid token and payload write once, flush, unlock, then acknowledge success", () => {
  const harness = createHarness();
  assert.deepEqual(harness.invoke(), { result: "success" });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.flushes, 1);
  assert.equal(harness.state.lockReleases, 1);
  assert.deepEqual(harness.state.requestedSheetNames, ["시트1"]);
  assert.equal(harness.state.activeSheetAccesses, 0);
  assert.equal(harness.state.logs.length, 0);
  assert.equal(harness.state.writes[0].values[0][2], "정부부처");
  assert.equal(
    Object.prototype.toString.call(harness.state.writes[0].values[0][0]),
    "[object Date]"
  );
  assert.ok(harness.state.events.indexOf("write") < harness.state.events.indexOf("flush"));
  assert.ok(harness.state.events.indexOf("flush") < harness.state.events.indexOf('response:{"result":"success"}'));
});

test("legacy 정보부처 input is normalized before validation and Sheet write", () => {
  const payload = validPayload();
  payload.affiliationType = "정보부처";
  const harness = createHarness();

  assert.deepEqual(harness.invoke(payload), { result: "success" });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.writes[0].values[0][2], "정부부처");
  assert.notEqual(harness.state.writes[0].values[0][2], "정보부처");
});

for (const [name, mutate, options = {}] of [
  ["missing token", (payload) => delete payload.authToken],
  ["wrong token", (payload) => { payload.authToken = WRONG_TOKEN; }],
  ["invalid-format token", (payload) => { payload.authToken = "short"; }],
  ["missing Script Property", () => {}, { propertyToken: null }],
]) {
  test(`authentication rejects ${name} before spreadsheet access`, () => {
    const payload = validPayload();
    mutate(payload);
    const harness = createHarness(options);
    assertRejected(harness, payload);
    assert.equal(harness.state.spreadsheetAccesses, 0);
    assert.equal(harness.state.logs.length, 0);
  });
}

for (const [name, raw] of [
  ["empty body", ""],
  ["malformed JSON", "{invalid"],
  ["null", "null"],
  ["array", "[]"],
  ["primitive", '"value"'],
]) {
  test(`request parsing rejects ${name}`, () => {
    const harness = createHarness();
    assertRejected(harness, undefined, raw);
    assert.equal(harness.state.spreadsheetAccesses, 0);
  });
}

test("request parsing rejects missing event and postData", () => {
  for (const event of [undefined, {}, { postData: {} }]) {
    const harness = createHarness();
    const response = harness.context.doPost(event);
    assert.deepEqual(JSON.parse(response.content), { result: "error" });
    assert.equal(harness.state.spreadsheetAccesses, 0);
  }
});

test("request parsing rejects an extra key and oversized UTF-8 body", () => {
  const extra = validPayload();
  extra.unexpected = "value";
  const extraHarness = createHarness();
  assertRejected(extraHarness, extra);
  assert.equal(extraHarness.state.spreadsheetAccesses, 0);

  const oversized = validPayload();
  oversized.name = "가".repeat(11_000);
  const oversizedHarness = createHarness();
  assertRejected(oversizedHarness, oversized);
  assert.equal(oversizedHarness.state.propertyReads, 0);
  assert.equal(oversizedHarness.state.spreadsheetAccesses, 0);
});

for (const field of [
  "name",
  "affiliationType",
  "orgName",
  "position",
  "phone",
  "email",
  "sessions",
  "consent",
]) {
  test(`request boundary rejects missing ${field}`, () => {
    const payload = validPayload();
    delete payload[field];
    const harness = createHarness();
    assertRejected(harness, payload);
  });
}

for (const [name, mutate] of [
  ["unknown affiliation", (payload) => { payload.affiliationType = "알 수 없음"; }],
  ["blank organization", (payload) => { payload.orgName = "   "; }],
  ["name over 100", (payload) => { payload.name = "n".repeat(101); }],
  ["affiliation over 50", (payload) => { payload.affiliationType = "a".repeat(51); }],
  ["organization over 200", (payload) => { payload.orgName = "o".repeat(201); }],
  ["position over 100", (payload) => { payload.position = "p".repeat(101); }],
  ["phone over 20", (payload) => { payload.phone = "0".repeat(21); }],
  ["email over 254", (payload) => { payload.email = `${"e".repeat(250)}@x.co`; }],
  ["invalid phone", (payload) => { payload.phone = "+82-10-0000-0000"; }],
  ["invalid email", (payload) => { payload.email = "invalid"; }],
  ["empty sessions", (payload) => { payload.sessions = []; }],
  ["unknown session", (payload) => { payload.sessions = ["unknown-session"]; }],
  ["duplicate session", (payload) => { payload.sessions = [siteContract.sessions[0], siteContract.sessions[0]]; }],
  ["consent mismatch", (payload) => { payload.consent = "disagree"; }],
]) {
  test(`payload validation rejects ${name} without a write`, () => {
    const payload = validPayload();
    mutate(payload);
    const harness = createHarness();
    assertRejected(harness, payload);
  });
}

test("missing sheet and header mismatch never write", () => {
  const missing = createHarness({ sheetMissing: true });
  assertRejected(missing);
  assert.deepEqual(missing.state.requestedSheetNames, ["시트1"]);

  const mismatch = createHarness({ headers: [...EXPECTED_HEADERS.slice(0, 8), "잘못된 헤더"] });
  assertRejected(mismatch);
  assert.equal(mismatch.state.headerReads, 1);
});

test("lock failure never accesses the spreadsheet", () => {
  const harness = createHarness({ lockAcquired: false });
  assertRejected(harness);
  assert.deepEqual(harness.state.lockAttempts, [5000]);
  assert.equal(harness.state.spreadsheetAccesses, 0);
  assert.equal(harness.state.lockReleases, 0);
});

test("setValues failure returns error and releases the acquired lock", () => {
  const harness = createHarness({ setValuesThrows: true });
  assertRejected(harness);
  assert.equal(harness.state.flushes, 0);
  assert.equal(harness.state.lockReleases, 1);
});

test("flush failure returns error and releases the acquired lock", () => {
  const harness = createHarness({ flushThrows: true });
  assert.deepEqual(harness.invoke(), { result: "error" });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.lockReleases, 1);
  assert.ok(!harness.state.responses.includes('{"result":"success"}'));
});

test("formula-like user strings are text-formatted and apostrophe-prefixed", () => {
  const payload = validPayload();
  payload.name = "=SUM(1,1)";
  payload.orgName = " \t+command";
  payload.position = "@hidden";
  payload.email = "-local@example.invalid";
  const harness = createHarness();
  assert.deepEqual(harness.invoke(payload), { result: "success" });
  assert.deepEqual(harness.state.formatCalls, [
    { row: 4, column: 2, rows: 1, columns: 8, format: "@" },
  ]);
  const row = harness.state.writes[0].values[0];
  assert.equal(row[1], "'=SUM(1,1)");
  assert.equal(row[3], "' \t+command");
  assert.equal(row[4], "'@hidden");
  assert.equal(row[6], "'-local@example.invalid");
  assert.equal(harness.context.safeCellText_("+82-10-0000-0000"), "'+82-10-0000-0000");
  assert.equal(harness.context.safeCellText_("\u0001-formula"), "'\u0001-formula");
  assert.equal(harness.state.logs.length, 0);
  assert.ok(harness.state.responses.every((response) => !response.includes(payload.name)));
  assert.ok(harness.state.responses.every((response) => !response.includes(VALID_TOKEN)));
});
