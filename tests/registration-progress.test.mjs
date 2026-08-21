import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registrationPath = path.join(repo, "src", "components", "Registration.tsx");
const registrationSource = fs.readFileSync(registrationPath, "utf8");

function loadRegistrationModule() {
  const compiledExports = {};
  const compiled = ts.transpileModule(registrationSource, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const inertComponent = () => null;
  const requireModule = (specifier) => {
    if (specifier === "react") {
      return {
        useEffect: () => undefined,
        useRef: (current) => ({ current }),
        useState: (initial) => [initial, () => undefined],
      };
    }
    if (specifier === "react/jsx-runtime") {
      return { Fragment: Symbol("Fragment"), jsx: inertComponent, jsxs: inertComponent };
    }
    if (specifier === "@phosphor-icons/react/dist/ssr") {
      return {
        CaretDown: inertComponent,
        CheckCircle: inertComponent,
        CircleNotch: inertComponent,
        WarningCircle: inertComponent,
      };
    }
    if (specifier === "./ui/Container") return { Container: inertComponent };
    if (specifier === "./ui/Reveal") return { Reveal: inertComponent };
    if (specifier === "@/lib/constants") {
      return {
        AFFILIATION_OPTIONS: [],
        PRIVACY_NOTICE: { items: "", purpose: "", retention: "" },
        REGISTRATION_SESSIONS: [],
        TRACK_LABELS: { track1: "Track 1", track2: "Track 2" },
        updateRegistrationSessionSelection: () => [],
      };
    }
    if (specifier === "@/lib/registration-payload") {
      return { buildRegistrationPayload: () => ({}) };
    }
    throw new Error(`Unexpected import: ${specifier}`);
  };

  new Function("exports", "require", compiled)(compiledExports, requireModule);
  return compiledExports;
}

function createFakeTimerScheduler() {
  let now = 0;
  let nextId = 1;
  const tasks = new Map();

  return {
    scheduler: {
      set(callback, delayMs) {
        const id = nextId;
        nextId += 1;
        tasks.set(id, { callback, dueAt: now + delayMs, cleared: false, ran: false });
        return id;
      },
      clear(id) {
        const task = tasks.get(id);
        if (task) task.cleared = true;
      },
    },
    advanceTo(targetMs) {
      now = targetMs;
      for (const task of [...tasks.values()].sort((a, b) => a.dueAt - b.dueAt)) {
        if (!task.cleared && !task.ran && task.dueAt <= now) {
          task.ran = true;
          task.callback();
        }
      }
    },
    pendingCount() {
      return [...tasks.values()].filter((task) => !task.cleared && !task.ran).length;
    },
  };
}

const registrationModule = loadRegistrationModule();
const progress = registrationModule.REGISTRATION_PROGRESS;
const scheduleProgress = registrationModule.scheduleRegistrationProgress;

test("registration progress thresholds and approved Korean messages remain exact", () => {
  assert.deepEqual(progress, {
    processing: {
      delayMs: 2_500,
      message: "등록 정보를 안전하게 처리 중입니다. 창을 닫거나 다시 제출하지 말아 주세요.",
    },
    delayed: {
      delayMs: 8_000,
      message: "응답이 다소 지연되고 있습니다. 접수 결과가 표시될 때까지 잠시만 기다려 주세요.",
    },
  });
});

test("deterministic timers show the 2.5 second and 8 second states in order", () => {
  const timers = createFakeTimerScheduler();
  const messages = [];
  const cleanup = scheduleProgress({
    generation: 4,
    isCurrent: (generation) => generation === 4,
    onMessage: (message) => messages.push(message),
    scheduler: timers.scheduler,
  });

  assert.equal(timers.pendingCount(), 2);
  timers.advanceTo(2_499);
  assert.deepEqual(messages, []);
  timers.advanceTo(2_500);
  assert.deepEqual(messages, [progress.processing.message]);
  timers.advanceTo(7_999);
  assert.deepEqual(messages, [progress.processing.message]);
  timers.advanceTo(8_000);
  assert.deepEqual(messages, [progress.processing.message, progress.delayed.message]);
  cleanup();
  assert.equal(timers.pendingCount(), 0);
});

test("cleanup prevents pending progress callbacks after success, failure, or unmount", () => {
  const timers = createFakeTimerScheduler();
  const messages = [];
  const cleanup = scheduleProgress({
    generation: 1,
    isCurrent: () => true,
    onMessage: (message) => messages.push(message),
    scheduler: timers.scheduler,
  });

  cleanup();
  timers.advanceTo(8_000);
  assert.deepEqual(messages, []);
  assert.equal(timers.pendingCount(), 0);
});

test("a newer submission generation blocks stale timer callbacks", () => {
  const timers = createFakeTimerScheduler();
  const messages = [];
  let currentGeneration = 7;
  scheduleProgress({
    generation: 7,
    isCurrent: (generation) => generation === currentGeneration,
    onMessage: (message) => messages.push(message),
    scheduler: timers.scheduler,
  });

  currentGeneration = 8;
  timers.advanceTo(8_000);
  assert.deepEqual(messages, []);
});

test("completion invalidation blocks a callback already queued before timer cleanup", () => {
  const queuedCallbacks = [];
  const messages = [];
  let currentGeneration = 11;
  const cleanup = scheduleProgress({
    generation: 11,
    isCurrent: (generation) => generation === currentGeneration,
    onMessage: (message) => messages.push(message),
    scheduler: {
      set(callback) {
        queuedCallbacks.push(callback);
        return queuedCallbacks.length;
      },
      clear() {
        // A callback already moved to the task queue cannot be removed by clearTimeout.
      },
    },
  });

  currentGeneration = 12;
  cleanup();
  queuedCallbacks.forEach((callback) => callback());
  assert.deepEqual(messages, []);
});

test("the form keeps immediate pending UI, accessibility, and responsive wrapping", () => {
  assert.match(registrationSource, /disabled=\{status === "submitting"\}/);
  assert.match(registrationSource, /<CircleNotch[^>]+animate-spin/);
  assert.match(registrationSource, /progressMessage \|\| "제출 중"/);
  assert.match(registrationSource, /role="status"/);
  assert.match(registrationSource, /aria-live="polite"/);
  assert.match(registrationSource, /aria-atomic="true"/);
  assert.match(registrationSource, /min-h-\[3rem\]/);
  assert.match(registrationSource, /\[overflow-wrap:break-word\]/);
  assert.match(registrationSource, /\[word-break:keep-all\]/);
});

test("submission wiring blocks double clicks and clears timers on every exit", () => {
  assert.match(registrationSource, /if \(submittingRef\.current\) return;/);
  assert.match(registrationSource, /submittingRef\.current = true;/);
  assert.match(
    registrationSource,
    /finally \{[\s\S]*submissionGenerationRef\.current = submissionGeneration \+ 1;[\s\S]*clearProgressTimersRef\.current\(\);[\s\S]*submittingRef\.current = false;[\s\S]*setProgressMessage\(""\);/
  );
  assert.match(
    registrationSource,
    /useEffect\(\(\) => \{[\s\S]*return \(\) => \{[\s\S]*submissionGenerationRef\.current \+= 1;[\s\S]*clearProgressTimersRef\.current\(\);/
  );
  assert.equal((registrationSource.match(/fetch\("\/api\/register"/g) || []).length, 1);
  assert.equal(registrationSource.includes("자동 재시도"), false);
});
