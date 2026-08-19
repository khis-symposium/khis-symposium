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

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(path.join(repo, file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function loadSiteModule() {
  const compiledExports = {};
  new Function("exports", transpile(path.join("src", "lib", "constants.ts")))(
    compiledExports
  );
  return compiledExports;
}

function loadRoute(fetchImpl) {
  const compiledExports = {};
  const isolatedProcess = {
    env: {
      REGISTRATION_UPSTREAM_URL: "http://127.0.0.1:9/register",
      REGISTRATION_UPSTREAM_TOKEN: VALID_TOKEN,
    },
  };

  new Function(
    "exports",
    "require",
    "process",
    "fetch",
    "Response",
    "AbortSignal",
    "DOMException",
    "console",
    transpile(path.join("src", "app", "api", "register", "route.ts"))
  )(
    compiledExports,
    (specifier) => {
      assert.equal(specifier, "@/lib/constants");
      return siteModule;
    },
    isolatedProcess,
    fetchImpl,
    Response,
    AbortSignal,
    DOMException,
    { info() {} }
  );

  return compiledExports;
}

function extractArray(name) {
  const match = code.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`));
  assert.ok(match, `${name} declaration must exist`);
  return vm.runInNewContext(match[1]);
}

const siteModule = loadSiteModule();
const siteContract = {
  affiliations: [...siteModule.AFFILIATION_TYPES],
  sessions: siteModule.REGISTRATION_SESSIONS.map((session) => session.id),
};

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

function storedRow(payload) {
  return [
    payload.name,
    payload.affiliationType,
    payload.orgName,
    payload.position,
    payload.phone,
    payload.email,
    payload.sessions.join(", "),
    payload.consent,
  ];
}

function defaultExistingRows() {
  const first = validPayload();
  first.name = "기존 테스트 등록 1";
  first.email = "existing-1@example.invalid";
  const second = validPayload();
  second.name = "기존 테스트 등록 2";
  second.email = "existing-2@example.invalid";
  return [storedRow(first), storedRow(second)];
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
    duplicateReads: 0,
    lastRowReads: 0,
    lockHeld: false,
  };
  const headers = options.headers || EXPECTED_HEADERS;
  const sheetRows = (options.existingRows || defaultExistingRows()).map((row, index) => [
    new Date(index),
    ...row,
  ]);
  state.sheetRows = sheetRows;
  const sheet = options.sheetMissing
    ? null
    : {
        getRange(row, column, rows, columns) {
          if (row === 1 && column === 1 && rows === 1 && columns === 9) {
            return {
              getValues() {
                assert.equal(state.lockHeld, true);
                state.headerReads += 1;
                state.events.push("headers");
                return [[...headers]];
              },
            };
          }

          if (row === 2 && column === 2 && columns === 8) {
            return {
              getValues() {
                assert.equal(state.lockHeld, true);
                state.duplicateReads += 1;
                state.events.push("duplicate-read");
                return sheetRows.slice(0, rows).map((existing) => existing.slice(1, 9));
              },
            };
          }

          return {
            setNumberFormat(format) {
              assert.equal(state.lockHeld, true);
              state.formatCalls.push({ row, column, rows, columns, format });
              state.events.push("format");
              return this;
            },
            setValues(values) {
              assert.equal(state.lockHeld, true);
              state.events.push("write");
              if (options.setValuesThrows) throw new Error("mock write failure");
              state.writes.push({ row, column, rows, columns, values });
              assert.equal(column, 1);
              assert.equal(rows, 1);
              assert.equal(columns, 9);
              sheetRows[row - 2] = [...values[0]];
              return this;
            },
          };
        },
        getLastRow() {
          assert.equal(state.lockHeld, true);
          state.lastRowReads += 1;
          state.events.push("last-row");
          return sheetRows.length + 1;
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
            if (options.lockAcquired === false) return false;
            assert.equal(state.lockHeld, false);
            state.lockHeld = true;
            return true;
          },
          releaseLock() {
            assert.equal(state.lockHeld, true);
            state.lockReleases += 1;
            state.events.push("unlock");
            state.lockHeld = false;
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
        assert.equal(state.lockHeld, true);
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

async function postRoute(route, payload) {
  return route.POST(
    new Request("http://127.0.0.1/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

test("Apps Script and Next constants use identical affiliations and session IDs", () => {
  assert.deepEqual([...extractArray("ALLOWED_KEYS_")], [
    "name",
    "affiliationType",
    "orgName",
    "position",
    "phone",
    "email",
    "sessions",
    "consent",
    "authToken",
  ]);
  assert.deepEqual([...extractArray("ALLOWED_AFFILIATIONS_")], siteContract.affiliations);
  assert.equal(siteContract.affiliations[0], "정부부처");
  assert.ok(!siteContract.affiliations.includes("정보부처"));
  assert.deepEqual([...extractArray("ALLOWED_SESSIONS_")], siteContract.sessions);
  assert.deepEqual([...extractArray("EXPECTED_HEADERS_")], EXPECTED_HEADERS);
});

test("valid token and payload write once, flush, unlock, then acknowledge success", () => {
  const harness = createHarness();
  assert.deepEqual(harness.invoke(), { result: "success", duplicate: false });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.flushes, 1);
  assert.equal(harness.state.duplicateReads, 1);
  assert.equal(harness.state.lastRowReads, 1);
  assert.equal(harness.state.lockReleases, 1);
  assert.deepEqual(harness.state.requestedSheetNames, ["시트1"]);
  assert.equal(harness.state.activeSheetAccesses, 0);
  assert.equal(harness.state.logs.length, 0);
  assert.equal(harness.state.writes[0].values[0][2], "정부부처");
  assert.equal(
    Object.prototype.toString.call(harness.state.writes[0].values[0][0]),
    "[object Date]"
  );
  assert.deepEqual(
    {
      row: harness.state.writes[0].row,
      column: harness.state.writes[0].column,
      rows: harness.state.writes[0].rows,
      columns: harness.state.writes[0].columns,
    },
    { row: 4, column: 1, rows: 1, columns: 9 }
  );
  assert.ok(harness.state.events.indexOf("write") < harness.state.events.indexOf("flush"));
  assert.ok(
    harness.state.events.indexOf("flush") <
      harness.state.events.indexOf('response:{"result":"success","duplicate":false}')
  );
  assert.ok(harness.state.events.indexOf("duplicate-read") < harness.state.events.indexOf("write"));
  assert.equal(harness.state.lockHeld, false);
});

test("legacy 정보부처 input is normalized before validation and Sheet write", () => {
  const payload = validPayload();
  payload.affiliationType = "정보부처";
  const harness = createHarness();

  assert.deepEqual(harness.invoke(payload), { result: "success", duplicate: false });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.writes[0].values[0][2], "정부부처");
  assert.notEqual(harness.state.writes[0].values[0][2], "정보부처");
});

test("a response-loss retry returns duplicate success without a second append", () => {
  const options = { flushThrows: true };
  const harness = createHarness(options);

  assert.deepEqual(harness.invoke(), { result: "error" });
  assert.equal(harness.state.writes.length, 1);
  options.flushThrows = false;

  assert.deepEqual(harness.invoke(), { result: "success", duplicate: true });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.flushes, 0);
  assert.equal(harness.state.lockAttempts.length, 2);
  assert.equal(harness.state.lockReleases, 2);
});

test("a Route timeout after an Apps write recovers through duplicate ACK without another append", async () => {
  const harness = createHarness();
  let upstreamCalls = 0;
  const route = loadRoute(async (_url, options) => {
    upstreamCalls += 1;
    const appResponse = harness.invoke(JSON.parse(options.body));
    if (upstreamCalls === 1) {
      assert.deepEqual(appResponse, { result: "success", duplicate: false });
      throw new DOMException("mock response loss after write", "TimeoutError");
    }
    return new Response(JSON.stringify(appResponse), { status: 200 });
  });
  const payload = validPayload();
  delete payload.authToken;

  const firstResponse = await postRoute(route, payload);
  assert.equal(firstResponse.status, 504);
  assert.deepEqual(await firstResponse.json(), { ok: false });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.flushes, 1);

  const retryResponse = await postRoute(route, payload);
  assert.equal(retryResponse.status, 200);
  assert.deepEqual(await retryResponse.json(), { ok: true, duplicate: true });
  assert.equal(upstreamCalls, 2);
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.flushes, 1);
});

test("canonical and legacy affiliation retries share one canonical duplicate", () => {
  const harness = createHarness();
  assert.deepEqual(harness.invoke(), { result: "success", duplicate: false });

  const legacy = validPayload();
  legacy.affiliationType = "정보부처";
  assert.deepEqual(harness.invoke(legacy), { result: "success", duplicate: true });
  assert.equal(harness.state.writes.length, 1);
  assert.equal(harness.state.sheetRows.at(-1)[2], "정부부처");

  const historicalLegacy = storedRow(validPayload());
  historicalLegacy[1] = "정보부처";
  const seeded = createHarness({ existingRows: [historicalLegacy] });
  assert.deepEqual(seeded.invoke(), { result: "success", duplicate: true });
  assert.equal(seeded.state.writes.length, 0);
});

test("the same session set is duplicate regardless of payload order", () => {
  const first = validPayload();
  first.sessions = [siteContract.sessions[0], siteContract.sessions[2]];
  const retry = { ...first, sessions: [...first.sessions].reverse() };
  const harness = createHarness();

  assert.deepEqual(harness.invoke(first), { result: "success", duplicate: false });
  assert.deepEqual(harness.invoke(retry), { result: "success", duplicate: true });
  assert.equal(harness.state.writes.length, 1);
});

for (const [field, mutate] of [
  ["name", (payload) => { payload.name = "다른 이름"; }],
  ["affiliationType", (payload) => { payload.affiliationType = "공공기관"; }],
  ["orgName", (payload) => { payload.orgName = "다른 기관"; }],
  ["position", (payload) => { payload.position = "다른 직위"; }],
  ["phone", (payload) => { payload.phone = "010-1111-2222"; }],
  ["email", (payload) => { payload.email = "different@example.invalid"; }],
  ["sessions", (payload) => { payload.sessions = [siteContract.sessions[2]]; }],
]) {
  test(`a valid payload with different ${field} creates a separate row`, () => {
    const harness = createHarness();
    assert.deepEqual(harness.invoke(), { result: "success", duplicate: false });
    const changed = validPayload();
    mutate(changed);
    assert.deepEqual(harness.invoke(changed), { result: "success", duplicate: false });
    assert.equal(harness.state.writes.length, 2);
  });
}

test("serialized concurrent identical requests append exactly once", async () => {
  const harness = createHarness();
  const [first, second] = await Promise.all([
    Promise.resolve().then(() => harness.invoke()),
    Promise.resolve().then(() => harness.invoke()),
  ]);

  assert.deepEqual(first, { result: "success", duplicate: false });
  assert.deepEqual(second, { result: "success", duplicate: true });
  assert.equal(harness.state.writes.length, 1);
  assert.deepEqual(harness.state.lockAttempts, [5000, 5000]);
  assert.equal(harness.state.lockReleases, 2);
  assert.equal(harness.state.lockHeld, false);
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
  ["same-slot sessions", (payload) => {
    payload.sessions = [siteContract.sessions[0], siteContract.sessions[1]];
  }],
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
  assert.deepEqual(harness.invoke(payload), { result: "success", duplicate: false });
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

for (const [roundTrip, storedName] of [
  ["preserved", "'=SUM(1,1)"],
  ["stripped", "=SUM(1,1)"],
]) {
  test(`formula-safe ${roundTrip} apostrophe round-trip remains an exact duplicate`, () => {
    const payload = validPayload();
    payload.name = "=SUM(1,1)";
    const existing = storedRow(payload);
    existing[0] = storedName;
    const harness = createHarness({ existingRows: [existing] });

    assert.deepEqual(harness.invoke(payload), { result: "success", duplicate: true });
    assert.equal(harness.state.writes.length, 0);
    assert.equal(harness.state.flushes, 0);
  });
}
