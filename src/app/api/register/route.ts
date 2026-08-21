import {
  AFFILIATION_TYPES,
  REGISTRATION_SESSIONS,
  hasRegistrationSessionSlotConflict,
} from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 32 * 1024;
const UPSTREAM_TIMEOUT_MS = 20_000;
const UPSTREAM_COMPLETION_BUFFER_MS = 10_000;
const UPSTREAM_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PHONE_PATTERN = /^0\d{1,2}-\d{3,4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FIELDS = new Set([
  "name",
  "affiliationType",
  "orgName",
  "position",
  "phone",
  "email",
  "sessions",
  "consent",
]);
const ALLOWED_AFFILIATIONS = new Set<string>(AFFILIATION_TYPES);
const ALLOWED_SESSIONS = new Set(REGISTRATION_SESSIONS.map((session) => session.id));
const LEGACY_AFFILIATION_ALIASES = new Map<string, string>([
  ["정보부처", "정부부처"],
]);

type RegistrationPayload = {
  name: string;
  affiliationType: string;
  orgName: string;
  position: string;
  phone: string;
  email: string;
  sessions: string[];
  consent: "agree";
};

function jsonResponse(ok: boolean, status: number, duplicate?: boolean) {
  const body: { ok: boolean; duplicate?: true } = { ok };
  if (ok && duplicate === true) {
    body.duplicate = true;
  }

  return Response.json(
    body,
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringWithin(value: unknown, maxLength: number, required = true): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (!required || value.trim().length > 0)
  );
}

function normalizeAffiliationType(value: unknown): unknown {
  return typeof value === "string"
    ? LEGACY_AFFILIATION_ALIASES.get(value) ?? value
    : value;
}

function parsePayload(value: unknown): RegistrationPayload | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !ALLOWED_FIELDS.has(key))) {
    return null;
  }

  const affiliationType = normalizeAffiliationType(value.affiliationType);

  if (
    !isStringWithin(value.name, 100) ||
    !isStringWithin(affiliationType, 50) ||
    !ALLOWED_AFFILIATIONS.has(affiliationType) ||
    !isStringWithin(value.orgName, 200) ||
    !isStringWithin(value.position, 100, false) ||
    !isStringWithin(value.phone, 20) ||
    !PHONE_PATTERN.test(value.phone) ||
    !isStringWithin(value.email, 254) ||
    !EMAIL_PATTERN.test(value.email) ||
    !Array.isArray(value.sessions) ||
    value.sessions.length === 0 ||
    value.sessions.length > ALLOWED_SESSIONS.size ||
    value.sessions.some(
      (session) => typeof session !== "string" || !ALLOWED_SESSIONS.has(session)
    ) ||
    new Set(value.sessions).size !== value.sessions.length ||
    hasRegistrationSessionSlotConflict(value.sessions) ||
    value.consent !== "agree"
  ) {
    return null;
  }

  return { ...value, affiliationType } as RegistrationPayload;
}

function getUpstreamUrl(): URL | null {
  const configuredUrl = process.env.REGISTRATION_UPSTREAM_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function getUpstreamToken(): string | null {
  const configuredToken = process.env.REGISTRATION_UPSTREAM_TOKEN;
  return configuredToken && UPSTREAM_TOKEN_PATTERN.test(configuredToken)
    ? configuredToken
    : null;
}

function hasErrorName(value: unknown, expectedName: "TimeoutError" | "AbortError") {
  return (value instanceof Error || value instanceof DOMException) && value.name === expectedName;
}

function classifyUpstreamFailure(error: unknown, signal: AbortSignal | null) {
  const signalReason = signal?.aborted ? signal.reason : undefined;
  if (hasErrorName(error, "TimeoutError") || hasErrorName(signalReason, "TimeoutError")) {
    return {
      outcome: "timeout" as const,
      errorCode: "upstream_timeout" as const,
      responseStatus: 504 as const,
    };
  }

  if (hasErrorName(error, "AbortError") || hasErrorName(signalReason, "AbortError")) {
    return {
      outcome: "abort" as const,
      errorCode: "upstream_abort" as const,
      responseStatus: 502 as const,
    };
  }

  return {
    outcome: "network_error" as const,
    errorCode: "upstream_network_error" as const,
    responseStatus: 502 as const,
  };
}

export async function POST(request: Request) {
  const requestStartedAt = Date.now();
  let requestId: string | null = null;
  let validationMs = 0;
  let preUpstreamMs = 0;
  let upstreamFetchMs = 0;
  let upstreamBodyMs = 0;
  let ackValidationMs = 0;
  let upstreamStatus: number | null = null;
  let redirected: boolean | null = null;
  let summaryDuplicate: boolean | null = null;

  function finish(
    outcome:
      | "success"
      | "validation_error"
      | "configuration_error"
      | "http_error"
      | "invalid_json"
      | "logical_error"
      | "timeout"
      | "abort"
      | "network_error",
    stage:
      | "validation"
      | "configuration"
      | "upstream_fetch"
      | "upstream_http"
      | "upstream_body"
      | "ack_validation"
      | "complete",
    errorCode:
      | "invalid_content_type"
      | "payload_too_large"
      | "request_body_unreadable"
      | "request_json_invalid"
      | "request_payload_invalid"
      | "upstream_configuration_invalid"
      | "upstream_timeout"
      | "upstream_abort"
      | "upstream_network_error"
      | "upstream_http_error"
      | "upstream_invalid_json"
      | "upstream_logical_ack_invalid"
      | null,
    responseStatus: number,
    ok = false,
    responseDuplicate?: boolean
  ) {
    const postUpstreamStartedAt = Date.now();
    const response = jsonResponse(ok, responseStatus, responseDuplicate);
    const finishedAt = Date.now();

    console.info(
      "[registration-latency]",
      JSON.stringify({
        requestId,
        validationMs,
        preUpstreamMs,
        upstreamFetchMs,
        upstreamBodyMs,
        ackValidationMs,
        postUpstreamMs: Math.max(0, finishedAt - postUpstreamStartedAt),
        totalMs: Math.max(0, finishedAt - requestStartedAt),
        status: upstreamStatus,
        redirected,
        duplicate: summaryDuplicate,
        outcome,
        stage,
        errorCode,
      })
    );

    return response;
  }

  function finishValidation(
    errorCode:
      | "invalid_content_type"
      | "payload_too_large"
      | "request_body_unreadable"
      | "request_json_invalid"
      | "request_payload_invalid",
    responseStatus: 400 | 413
  ) {
    validationMs = Math.max(0, Date.now() - requestStartedAt);
    return finish("validation_error", "validation", errorCode, responseStatus);
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return finishValidation("invalid_content_type", 400);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return finishValidation("payload_too_large", 413);
  }

  let rawBody: ArrayBuffer;
  try {
    rawBody = await request.arrayBuffer();
  } catch {
    return finishValidation("request_body_unreadable", 400);
  }

  if (rawBody.byteLength > MAX_BODY_BYTES) {
    return finishValidation("payload_too_large", 413);
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return finishValidation("request_json_invalid", 400);
  }

  const payload = parsePayload(candidate);
  if (!payload) {
    return finishValidation("request_payload_invalid", 400);
  }

  const validationFinishedAt = Date.now();
  validationMs = Math.max(0, validationFinishedAt - requestStartedAt);
  requestId = crypto.randomUUID();

  const upstreamUrl = getUpstreamUrl();
  const upstreamToken = getUpstreamToken();
  if (!upstreamUrl || !upstreamToken) {
    preUpstreamMs = Math.max(0, Date.now() - validationFinishedAt);
    return finish(
      "configuration_error",
      "configuration",
      "upstream_configuration_invalid",
      503
    );
  }

  const upstreamRequestBody = JSON.stringify({
    ...payload,
    authToken: upstreamToken,
    requestId,
  });
  preUpstreamMs = Math.max(0, Date.now() - validationFinishedAt);
  const upstreamFetchStartedAt = Date.now();

  let upstreamResponse: Response;
  let upstreamSignal: AbortSignal | null = null;

  try {
    upstreamSignal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: upstreamRequestBody,
      cache: "no-store",
      redirect: "follow",
      signal: upstreamSignal,
    });
  } catch (error) {
    upstreamFetchMs = Math.max(0, Date.now() - upstreamFetchStartedAt);
    const failure = classifyUpstreamFailure(error, upstreamSignal);
    return finish(
      failure.outcome,
      "upstream_fetch",
      failure.errorCode,
      failure.responseStatus
    );
  }

  upstreamFetchMs = Math.max(0, Date.now() - upstreamFetchStartedAt);
  upstreamStatus = upstreamResponse.status;
  redirected = upstreamResponse.redirected;

  if (!upstreamResponse.ok) {
    return finish("http_error", "upstream_http", "upstream_http_error", 502);
  }

  const upstreamBodyStartedAt = Date.now();
  let upstreamBodyText: string;
  try {
    upstreamBodyText = await upstreamResponse.text();
  } catch (error) {
    upstreamBodyMs = Math.max(0, Date.now() - upstreamBodyStartedAt);
    const failure = classifyUpstreamFailure(error, upstreamSignal);
    return finish(
      failure.outcome,
      "upstream_body",
      failure.errorCode,
      failure.responseStatus
    );
  }
  upstreamBodyMs = Math.max(0, Date.now() - upstreamBodyStartedAt);

  const ackValidationStartedAt = Date.now();
  let upstreamBody: unknown;
  try {
    upstreamBody = JSON.parse(upstreamBodyText);
  } catch {
    ackValidationMs = Math.max(0, Date.now() - ackValidationStartedAt);
    return finish("invalid_json", "ack_validation", "upstream_invalid_json", 502);
  }

  if (
    !isRecord(upstreamBody) ||
    upstreamBody.result !== "success" ||
    (upstreamBody.duplicate !== undefined && typeof upstreamBody.duplicate !== "boolean")
  ) {
    ackValidationMs = Math.max(0, Date.now() - ackValidationStartedAt);
    return finish(
      "logical_error",
      "ack_validation",
      "upstream_logical_ack_invalid",
      502
    );
  }

  ackValidationMs = Math.max(0, Date.now() - ackValidationStartedAt);
  const duplicate = upstreamBody.duplicate === true;
  summaryDuplicate = duplicate;
  return finish("success", "complete", null, 200, true, duplicate);
}

if (UPSTREAM_TIMEOUT_MS + UPSTREAM_COMPLETION_BUFFER_MS > maxDuration * 1_000) {
  throw new Error("Registration upstream timeout exceeds the route duration budget");
}
