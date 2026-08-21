export type RegistrationPayload = Record<string, string | string[]>;

export function buildRegistrationPayload(formData: FormData): RegistrationPayload {
  const payload: RegistrationPayload = {};

  formData.forEach((value, key) => {
    if (key === "sessions") {
      const existing = payload.sessions;
      const sessions = Array.isArray(existing) ? existing : [];
      sessions.push(String(value));
      payload.sessions = sessions;
    } else {
      payload[key] = String(value);
    }
  });

  return payload;
}
