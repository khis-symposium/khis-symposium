import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routePath = path.join("src", "app", "api", "register", "route.ts");
const routeSource = fs.readFileSync(path.join(repo, routePath), "utf8");
const token = "T".repeat(43);
const upstreamUrl = "https://upstream.invalid/private-registration-endpoint";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(path.join(repo, file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function loadConstants() {
  const compiledExports = {};
  new Function("exports", transpile(path.join("src", "lib", "constants.ts")))(
    compiledExports
  );
  return compiledExports;
}

const constants = loadConstants();

function loadRoute(fetchImpl, options = {}) {
  const compiledExports = {};
  const requireModule = (specifier) => {
    assert.equal(specifier, "@/lib/constants");
    return constants;
  };
  const logs = [];
  const isolatedProcess = {
    env: {
      REGISTRATION_UPSTREAM_URL: upstreamUrl,
      REGISTRATION_UPSTREAM_TOKEN: token,
      ...options.env,
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
    "crypto",
    "Date",
    transpile(routePath)
  )(
    compiledExports,
    requireModule,
    isolatedProcess,
    fetchImpl,
    Response,
    options.abortSignal || AbortSignal,
    options.domException || DOMException,
    { info: (...values) => logs.push(values) },
    options.crypto || globalThis.crypto,
    options.date || Date
  );

  return { route: compiledExports, logs };
}

function validPayload() {
  return {
    name: "개인정보-이름-로그금지",
    affiliationType: constants.AFFILIATION_TYPES[0],
    orgName: "개인정보-소속-로그금지",
    position: "개인정보-직위-로그금지",
    phone: "010-9876-5432",
    email: "privacy-log-check@example.invalid",
    sessions: [constants.REGISTRATION_SESSIONS[0].id],
    consent: "agree",
  };
}

async function post(postHandler, payload) {
  return postHandler(
    new Request("http://127.0.0.1/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

function parseSingleSummary(logs, { expectRequestId = true } = {}) {
  assert.equal(logs.length, 1, "one final summary must be emitted");
  assert.equal(logs[0].length, 2);
  assert.equal(logs[0][0], "[registration-latency]");
  const summary = JSON.parse(logs[0][1]);
  assert.deepEqual(Object.keys(summary).sort(), [
    "ackValidationMs",
    "duplicate",
    "errorCode",
    "outcome",
    "postUpstreamMs",
    "preUpstreamMs",
    "redirected",
    "requestId",
    "stage",
    "status",
    "totalMs",
    "upstreamBodyMs",
    "upstreamFetchMs",
    "validationMs",
  ]);
  if (expectRequestId) {
    assert.match(summary.requestId, uuidPattern);
  } else {
    assert.equal(summary.requestId, null);
  }
  for (const key of [
    "validationMs",
    "preUpstreamMs",
    "upstreamFetchMs",
    "upstreamBodyMs",
    "ackValidationMs",
    "postUpstreamMs",
    "totalMs",
  ]) {
    assert.equal(Number.isInteger(summary[key]), true, `${key} must be an integer`);
    assert.ok(summary[key] >= 0, `${key} must be non-negative`);
  }
  const exclusiveStageSum = [
    "validationMs",
    "preUpstreamMs",
    "upstreamFetchMs",
    "upstreamBodyMs",
    "ackValidationMs",
    "postUpstreamMs",
  ].reduce((sum, key) => sum + summary[key], 0);
  assert.ok(
    exclusiveStageSum <= summary.totalMs,
    `exclusive stage sum ${exclusiveStageSum} must not exceed totalMs ${summary.totalMs}`
  );
  return { summary, serialized: logs[0][1] };
}

function assertNoSensitiveValues(serialized, payload = validPayload()) {
  for (const sensitiveValue of [
    payload.name,
    payload.email,
    payload.phone,
    payload.orgName,
    payload.position,
    ...payload.sessions,
    token,
    upstreamUrl,
  ]) {
    assert.doesNotMatch(serialized, new RegExp(sensitiveValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
}

test("Route generates a private UUID, forwards it upstream, and logs the same ID once", async () => {
  const upstreamBodies = [];
  const { route, logs } = loadRoute(async (_url, options) => {
    upstreamBodies.push(JSON.parse(options.body));
    return new Response('{"result":"success","duplicate":false}', { status: 200 });
  });

  const payload = validPayload();
  const response = await post(route.POST, payload);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(upstreamBodies.length, 1);
  assert.match(upstreamBodies[0].requestId, uuidPattern);
  assert.equal(upstreamBodies[0].authToken, token);

  const { summary, serialized } = parseSingleSummary(logs);
  assert.equal(summary.requestId, upstreamBodies[0].requestId);
  assert.equal(summary.status, 200);
  assert.equal(summary.redirected, false);
  assert.equal(summary.duplicate, false);
  assert.equal(summary.outcome, "success");
  assert.equal(summary.stage, "complete");
  assert.equal(summary.errorCode, null);
  assertNoSensitiveValues(serialized, payload);
});

test("a browser payload cannot inject or choose the correlation ID", async () => {
  let upstreamCalls = 0;
  let uuidCalls = 0;
  const { route, logs } = loadRoute(
    async () => {
      upstreamCalls += 1;
      return new Response('{"result":"success"}', { status: 200 });
    },
    {
      crypto: {
        randomUUID() {
          uuidCalls += 1;
          return "11111111-1111-4111-8111-111111111111";
        },
      },
    }
  );
  const payload = { ...validPayload(), requestId: "00000000-0000-4000-8000-000000000000" };

  const response = await post(route.POST, payload);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(upstreamCalls, 0);
  assert.equal(uuidCalls, 0);
  const { summary, serialized } = parseSingleSummary(logs, { expectRequestId: false });
  assert.equal(summary.outcome, "validation_error");
  assert.equal(summary.stage, "validation");
  assert.equal(summary.errorCode, "request_payload_invalid");
  assert.equal(summary.status, null);
  assert.equal(summary.redirected, null);
  assert.equal(summary.duplicate, null);
  assert.equal(summary.preUpstreamMs, 0);
  assertNoSensitiveValues(serialized, payload);
});

for (const scenario of [
  {
    name: "invalid content type",
    request: () =>
      new Request("http://127.0.0.1/api/register", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(validPayload()),
      }),
    responseStatus: 400,
    errorCode: "invalid_content_type",
  },
  {
    name: "declared oversized payload",
    request: () =>
      new Request("http://127.0.0.1/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(32 * 1024 + 1),
        },
        body: "{}",
      }),
    responseStatus: 413,
    errorCode: "payload_too_large",
  },
  {
    name: "unreadable request body",
    request: () => ({
      headers: new Headers({ "Content-Type": "application/json" }),
      async arrayBuffer() {
        throw new Error(`private request body detail ${token}`);
      },
    }),
    responseStatus: 400,
    errorCode: "request_body_unreadable",
  },
  {
    name: "actual oversized payload",
    request: () =>
      new Request("http://127.0.0.1/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(32 * 1024 + 1),
      }),
    responseStatus: 413,
    errorCode: "payload_too_large",
  },
  {
    name: "malformed request JSON",
    request: () =>
      new Request("http://127.0.0.1/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email":"privacy-log-check@example.invalid"',
      }),
    responseStatus: 400,
    errorCode: "request_json_invalid",
  },
]) {
  test(`${scenario.name} emits one PII-free validation summary without generating a UUID`, async () => {
    let upstreamCalls = 0;
    let uuidCalls = 0;
    const { route, logs } = loadRoute(
      async () => {
        upstreamCalls += 1;
        return new Response('{"result":"success"}', { status: 200 });
      },
      {
        crypto: {
          randomUUID() {
            uuidCalls += 1;
            return "11111111-1111-4111-8111-111111111111";
          },
        },
      }
    );

    const response = await route.POST(scenario.request());
    assert.equal(response.status, scenario.responseStatus);
    assert.deepEqual(await response.json(), { ok: false });
    assert.equal(upstreamCalls, 0);
    assert.equal(uuidCalls, 0);

    const { summary, serialized } = parseSingleSummary(logs, { expectRequestId: false });
    assert.equal(summary.outcome, "validation_error");
    assert.equal(summary.stage, "validation");
    assert.equal(summary.errorCode, scenario.errorCode);
    assert.equal(summary.status, null);
    assert.equal(summary.redirected, null);
    assert.equal(summary.duplicate, null);
    assert.equal(summary.preUpstreamMs, 0);
    assert.equal(summary.upstreamFetchMs, 0);
    assert.equal(summary.upstreamBodyMs, 0);
    assert.equal(summary.ackValidationMs, 0);
    assertNoSensitiveValues(serialized);
    assert.doesNotMatch(serialized, /private request body detail/);
  });
}

test("duplicate ACK preserves the API contract and is represented in the summary", async () => {
  const { route, logs } = loadRoute(async () =>
    new Response('{"result":"success","duplicate":true}', { status: 200 })
  );

  const response = await post(route.POST, validPayload());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, duplicate: true });
  const { summary, serialized } = parseSingleSummary(logs);
  assert.equal(summary.duplicate, true);
  assert.equal(summary.outcome, "success");
  assertNoSensitiveValues(serialized);
});

test("a body-read AbortError caused by the timeout signal remains HTTP 504", async () => {
  const timeoutCalls = [];
  const timeoutReason = new DOMException(`private timeout reason ${token}`, "TimeoutError");
  const timeoutSignal = { aborted: true, reason: timeoutReason };
  let receivedSignal;
  const { route, logs } = loadRoute(
    async (_url, options) => {
      receivedSignal = options.signal;
      return {
        ok: true,
        status: 200,
        redirected: false,
        async text() {
          throw new DOMException("private body abort detail", "AbortError");
        },
      };
    },
    {
      abortSignal: {
        timeout(milliseconds) {
          timeoutCalls.push(milliseconds);
          return timeoutSignal;
        },
      },
    }
  );

  const response = await post(route.POST, validPayload());
  assert.equal(response.status, 504);
  assert.deepEqual(await response.json(), { ok: false });
  assert.deepEqual(timeoutCalls, [20_000]);
  assert.equal(receivedSignal, timeoutSignal);

  const { summary, serialized } = parseSingleSummary(logs);
  assert.equal(summary.status, 200);
  assert.equal(summary.redirected, false);
  assert.equal(summary.duplicate, null);
  assert.equal(summary.outcome, "timeout");
  assert.equal(summary.stage, "upstream_body");
  assert.equal(summary.errorCode, "upstream_timeout");
  assertNoSensitiveValues(serialized);
  assert.doesNotMatch(serialized, /private (?:timeout reason|body abort detail)/);
});

for (const scenario of [
  {
    name: "upstream HTTP failure",
    fetchImpl: async () => new Response("private upstream body", { status: 503 }),
    responseStatus: 502,
    upstreamStatus: 503,
    outcome: "http_error",
    stage: "upstream_http",
    errorCode: "upstream_http_error",
  },
  {
    name: "malformed upstream JSON",
    fetchImpl: async () => new Response("not-json", { status: 200 }),
    responseStatus: 502,
    upstreamStatus: 200,
    outcome: "invalid_json",
    stage: "ack_validation",
    errorCode: "upstream_invalid_json",
  },
  {
    name: "logical ACK failure",
    fetchImpl: async () => new Response('{"result":"error"}', { status: 200 }),
    responseStatus: 502,
    upstreamStatus: 200,
    outcome: "logical_error",
    stage: "ack_validation",
    errorCode: "upstream_logical_ack_invalid",
  },
  {
    name: "timeout",
    fetchImpl: async () => {
      throw new DOMException("private timeout detail", "TimeoutError");
    },
    responseStatus: 504,
    upstreamStatus: null,
    outcome: "timeout",
    stage: "upstream_fetch",
    errorCode: "upstream_timeout",
  },
  {
    name: "non-timeout abort",
    fetchImpl: async () => {
      throw new DOMException("private abort detail", "AbortError");
    },
    responseStatus: 502,
    upstreamStatus: null,
    outcome: "abort",
    stage: "upstream_fetch",
    errorCode: "upstream_abort",
  },
  {
    name: "network failure",
    fetchImpl: async () => {
      throw new Error(`private network detail ${token}`);
    },
    responseStatus: 502,
    upstreamStatus: null,
    outcome: "network_error",
    stage: "upstream_fetch",
    errorCode: "upstream_network_error",
  },
  {
    name: "upstream body read failure",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      redirected: false,
      async text() {
        throw new Error(`private body detail ${token}`);
      },
    }),
    responseStatus: 502,
    upstreamStatus: 200,
    outcome: "network_error",
    stage: "upstream_body",
    errorCode: "upstream_network_error",
  },
]) {
  test(`${scenario.name} fails closed with one safe final summary`, async () => {
    const { route, logs } = loadRoute(scenario.fetchImpl);
    const response = await post(route.POST, validPayload());
    assert.equal(response.status, scenario.responseStatus);
    assert.deepEqual(await response.json(), { ok: false });

    const { summary, serialized } = parseSingleSummary(logs);
    assert.equal(summary.status, scenario.upstreamStatus);
    assert.equal(summary.outcome, scenario.outcome);
    assert.equal(summary.stage, scenario.stage);
    assert.equal(summary.errorCode, scenario.errorCode);
    assert.equal(summary.duplicate, null);
    assertNoSensitiveValues(serialized);
    assert.doesNotMatch(serialized, /private (?:timeout|abort|network|body) detail/);
  });
}

test("validated requests with invalid server configuration get one safe summary", async () => {
  let upstreamCalls = 0;
  const timestamps = [100, 120, 127, 128, 130];
  const { route, logs } = loadRoute(
    async () => {
      upstreamCalls += 1;
      return new Response('{"result":"success"}', { status: 200 });
    },
    {
      env: { REGISTRATION_UPSTREAM_TOKEN: undefined },
      date: {
        now() {
          assert.ok(timestamps.length > 0);
          return timestamps.shift();
        },
      },
    }
  );

  const response = await post(route.POST, validPayload());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(upstreamCalls, 0);
  const { summary, serialized } = parseSingleSummary(logs);
  assert.equal(summary.status, null);
  assert.equal(summary.redirected, null);
  assert.equal(summary.duplicate, null);
  assert.equal(summary.outcome, "configuration_error");
  assert.equal(summary.stage, "configuration");
  assert.equal(summary.errorCode, "upstream_configuration_invalid");
  assert.equal(summary.validationMs, 20);
  assert.equal(summary.preUpstreamMs, 7);
  assert.equal(summary.postUpstreamMs, 2);
  assert.equal(summary.totalMs, 30);
  assert.equal(timestamps.length, 0);
  assertNoSensitiveValues(serialized);
});

test("twenty-second timeout, maxDuration, payload cap, and approved log schema remain fixed", () => {
  assert.match(routeSource, /const MAX_BODY_BYTES = 32 \* 1024;/);
  assert.match(routeSource, /const UPSTREAM_TIMEOUT_MS = 20_000;/);
  assert.match(routeSource, /export const maxDuration = 30;/);
  assert.match(routeSource, /AbortSignal\.timeout\(UPSTREAM_TIMEOUT_MS\)/);
  assert.doesNotMatch(routeSource, /console\.(?:log|warn|error|debug)\(/);
  assert.equal((routeSource.match(/console\.info\(/g) || []).length, 1);
});
