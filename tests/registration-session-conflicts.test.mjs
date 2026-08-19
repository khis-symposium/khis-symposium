import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function loadRoute(constants, fetchImpl) {
  const compiledExports = {};
  const requireModule = (specifier) => {
    assert.equal(specifier, "@/lib/constants");
    return constants;
  };
  const isolatedProcess = {
    env: {
      REGISTRATION_UPSTREAM_URL: "http://127.0.0.1:9/register",
      REGISTRATION_UPSTREAM_TOKEN: "A".repeat(43),
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
    transpile(path.join("src", "app", "api", "register", "route.ts"))
  )(
    compiledExports,
    requireModule,
    isolatedProcess,
    fetchImpl,
    Response,
    AbortSignal,
    DOMException
  );

  return compiledExports;
}

const constants = loadConstants();
const sessions = constants.REGISTRATION_SESSIONS;

test("registration uses the canonical 정부부처 label and value", () => {
  assert.equal(constants.AFFILIATION_OPTIONS.length, 8);
  assert.equal(constants.AFFILIATION_OPTIONS[0].label, "정부부처");
  assert.equal(constants.AFFILIATION_OPTIONS[0].value, "정부부처");
  assert.equal(
    constants.AFFILIATION_OPTIONS.filter(({ label }) => label === "정부부처").length,
    1
  );
  assert.equal(
    constants.AFFILIATION_OPTIONS.filter(({ value }) => value === "정부부처").length,
    1
  );
  assert.ok(constants.AFFILIATION_OPTIONS.every(
    ({ label, value }) => label !== "정보부처" && value !== "정보부처"
  ));
  assert.deepEqual(
    constants.AFFILIATION_OPTIONS.map(({ value }) => value),
    [...constants.AFFILIATION_TYPES]
  );
  assert.deepEqual(constants.AFFILIATION_TYPES.slice(1), [
    "공공기관",
    "의료기관",
    "협회·학계",
    "산업계",
    "언론",
    "학생",
    "기타",
  ]);
});

function validPayload(selectedSessions = [sessions[0].id]) {
  return {
    name: "로컬 회귀 테스트",
    affiliationType: constants.AFFILIATION_TYPES[0],
    orgName: "가상 테스트 기관",
    position: "테스터",
    phone: "010-0000-0000",
    email: "local-test@example.invalid",
    sessions: selectedSessions,
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

test("registration catalog keeps 12 deployed IDs while showing the V3 time", () => {
  assert.equal(sessions.length, 12);
  const firstSlot = sessions.filter(
    (session) => session.dayId === "day1" && session.time === "11:10 – 12:30"
  );
  assert.equal(firstSlot.length, 2);
  assert.deepEqual(
    firstSlot.map((session) => session.id),
    ["day1-10:50 – 12:30-t1", "day1-10:50 – 12:30-t2"]
  );
  assert.ok(firstSlot.every((session) => session.slotKey === "day1::11:10 – 12:30"));
});

test("selecting Track 2 replaces Track 1 in the same day and time slot", () => {
  const [track1, track2] = sessions.slice(0, 2);
  let selected = constants.updateRegistrationSessionSelection([], track1.id, true);
  selected = constants.updateRegistrationSessionSelection(selected, track2.id, true);
  assert.deepEqual(selected, [track2.id]);
});

test("selecting Track 1 replaces Track 2 in the same day and time slot", () => {
  const [track1, track2] = sessions.slice(0, 2);
  let selected = constants.updateRegistrationSessionSelection([], track2.id, true);
  selected = constants.updateRegistrationSessionSelection(selected, track1.id, true);
  assert.deepEqual(selected, [track1.id]);
});

test("sessions in different time slots remain selected together", () => {
  const first = sessions[0];
  const later = sessions.find(
    (session) => session.dayId === first.dayId && session.slotKey !== first.slotKey
  );
  assert.ok(later);
  let selected = constants.updateRegistrationSessionSelection([], first.id, true);
  selected = constants.updateRegistrationSessionSelection(selected, later.id, true);
  assert.deepEqual(selected, [first.id, later.id]);
});

test("the same displayed time on different days does not conflict", () => {
  const synthetic = [
    { id: "day1-track", slotKey: "day1::10:00 – 11:00" },
    { id: "day2-track", slotKey: "day2::10:00 – 11:00" },
  ];
  let selected = constants.updateRegistrationSessionSelection(
    [],
    synthetic[0].id,
    true,
    synthetic
  );
  selected = constants.updateRegistrationSessionSelection(
    selected,
    synthetic[1].id,
    true,
    synthetic
  );
  assert.deepEqual(selected, synthetic.map((session) => session.id));
  assert.equal(constants.hasRegistrationSessionSlotConflict(selected, synthetic), false);
});

test("route rejects a forged same-slot payload before upstream fetch", async () => {
  let upstreamCalls = 0;
  const route = loadRoute(constants, async () => {
    upstreamCalls += 1;
    return new Response('{"result":"success"}', { status: 200 });
  });
  const response = await post(route.POST, validPayload(sessions.slice(0, 2).map((session) => session.id)));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(upstreamCalls, 0);
});

test("route accepts non-conflicting sessions and preserves the upstream contract", async () => {
  const selected = [sessions[0].id, sessions[2].id];
  const upstreamRequests = [];
  const route = loadRoute(constants, async (url, options) => {
    upstreamRequests.push({ url, options });
    return new Response('{"result":"success"}', { status: 200 });
  });
  const response = await post(route.POST, validPayload(selected));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(upstreamRequests.length, 1);

  const upstreamBody = JSON.parse(upstreamRequests[0].options.body);
  assert.equal(upstreamBody.affiliationType, "정부부처");
  assert.deepEqual(upstreamBody.sessions, selected);
  assert.equal(upstreamBody.authToken.length, 43);
  assert.deepEqual(Object.keys(upstreamBody).sort(), [
    "affiliationType",
    "authToken",
    "consent",
    "email",
    "name",
    "orgName",
    "phone",
    "position",
    "sessions",
  ]);
});

test("route normalizes the legacy 정보부처 alias before the upstream request", async () => {
  const upstreamBodies = [];
  const route = loadRoute(constants, async (_url, options) => {
    upstreamBodies.push(JSON.parse(options.body));
    return new Response('{"result":"success"}', { status: 200 });
  });
  const payload = validPayload();
  payload.affiliationType = "정보부처";

  const response = await post(route.POST, payload);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(upstreamBodies.length, 1);
  assert.equal(upstreamBodies[0].affiliationType, "정부부처");
});

test("route rejects an unknown affiliation before the upstream request", async () => {
  let upstreamCalls = 0;
  const route = loadRoute(constants, async () => {
    upstreamCalls += 1;
    return new Response('{"result":"success"}', { status: 200 });
  });
  const payload = validPayload();
  payload.affiliationType = "알 수 없음";

  const response = await post(route.POST, payload);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(upstreamCalls, 0);
});
