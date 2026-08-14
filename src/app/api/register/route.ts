import {
  AFFILIATION_TYPES,
  REGISTRATION_SESSIONS,
  hasRegistrationSessionSlotConflict,
} from "@/lib/constants";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;
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

function jsonResponse(ok: boolean, status: number) {
  return Response.json(
    { ok },
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

function parsePayload(value: unknown): RegistrationPayload | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !ALLOWED_FIELDS.has(key))) {
    return null;
  }

  if (
    !isStringWithin(value.name, 100) ||
    !isStringWithin(value.affiliationType, 50) ||
    !ALLOWED_AFFILIATIONS.has(value.affiliationType) ||
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

  return value as RegistrationPayload;
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

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse(false, 400);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(false, 413);
  }

  let rawBody: ArrayBuffer;
  try {
    rawBody = await request.arrayBuffer();
  } catch {
    return jsonResponse(false, 400);
  }

  if (rawBody.byteLength > MAX_BODY_BYTES) {
    return jsonResponse(false, 413);
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return jsonResponse(false, 400);
  }

  const payload = parsePayload(candidate);
  if (!payload) {
    return jsonResponse(false, 400);
  }

  const upstreamUrl = getUpstreamUrl();
  const upstreamToken = getUpstreamToken();
  if (!upstreamUrl || !upstreamToken) {
    return jsonResponse(false, 503);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, authToken: upstreamToken }),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstreamResponse.ok) {
      return jsonResponse(false, 502);
    }

    const upstreamBody: unknown = JSON.parse(await upstreamResponse.text());
    if (!isRecord(upstreamBody) || upstreamBody.result !== "success") {
      return jsonResponse(false, 502);
    }

    return jsonResponse(true, 200);
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    return jsonResponse(false, isTimeout ? 504 : 502);
  }
}
