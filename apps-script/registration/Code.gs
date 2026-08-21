const MAX_BODY_BYTES_ = 32 * 1024;
const TOKEN_PROPERTY_NAME_ = "REGISTRATION_UPSTREAM_TOKEN";
const TOKEN_PATTERN_ = /^[A-Za-z0-9_-]{43}$/;
const REQUEST_ID_MAX_LENGTH_ = 36;
const REQUEST_ID_PATTERN_ = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_PATTERN_ = /^0\d{1,2}-\d{3,4}-\d{4}$/;
const EMAIL_PATTERN_ = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TARGET_SHEET_NAME_ = "시트1";
const LOCK_TIMEOUT_MS_ = 5000;
const ALLOWED_KEYS_ = [
  "name",
  "affiliationType",
  "orgName",
  "position",
  "phone",
  "email",
  "sessions",
  "consent",
  "authToken",
  "requestId"
];
const REQUIRED_KEYS_ = [
  "name",
  "affiliationType",
  "orgName",
  "position",
  "phone",
  "email",
  "sessions",
  "consent",
  "authToken"
];
const ALLOWED_AFFILIATIONS_ = [
  "정부부처",
  "공공기관",
  "의료기관",
  "협회·학계",
  "산업계",
  "언론",
  "학생",
  "기타"
];
const LEGACY_AFFILIATION_ALIASES_ = {
  "정보부처": "정부부처"
};
const ALLOWED_SESSIONS_ = [
  "day1-09:30 – 10:25-common",
  "day1-10:50 – 12:30-t1",
  "day1-10:50 – 12:30-t2",
  "day1-13:50 – 15:30-t1",
  "day1-13:50 – 15:30-t2",
  "day1-15:50 – 17:30-t1",
  "day1-15:50 – 17:30-t2",
  "day2-10:00 – 11:40-t1",
  "day2-10:00 – 11:40-t2",
  "day2-13:00 – 14:40-t1",
  "day2-13:00 – 14:40-t2",
  "day2-15:00 – 16:40-t1",
  "day2-15:00 – 16:40-t2"
];
const EXPECTED_HEADERS_ = [
  "타임스탬프",
  "성명",
  "소속분류",
  "소속명",
  "직위",
  "연락처",
  "이메일",
  "참여세션",
  "동의여부"
];

function doPost(e) {
  const timing = {
    requestId: null,
    authMs: 0,
    validationMs: 0,
    lockWaitMs: 0,
    lookupMs: 0,
    appendMs: 0,
    flushMs: 0,
    totalMs: 0,
    duplicate: null,
    outcome: "exception"
  };
  const requestStartedAt = Date.now();
  let lock = null;
  let lockAcquired = false;

  try {
    const parseStartedAt = Date.now();
    let data;
    try {
      data = parseRequest_(e);
    } finally {
      timing.validationMs += elapsedMs_(parseStartedAt);
    }

    if (!data) {
      timing.outcome = "validation_error";
      return resultResponse_("error");
    }

    const authStartedAt = Date.now();
    let authorized;
    try {
      authorized = isAuthorized_(data.authToken);
    } finally {
      timing.authMs = elapsedMs_(authStartedAt);
    }

    if (!authorized) {
      timing.outcome = "auth_error";
      return resultResponse_("error");
    }

    const validationStartedAt = Date.now();
    let validRequestId;
    let validPayload;
    try {
      validRequestId = isValidOptionalRequestId_(data);
      if (validRequestId && Object.prototype.hasOwnProperty.call(data, "requestId")) {
        timing.requestId = data.requestId;
      }
      data.affiliationType = normalizeAffiliation_(data.affiliationType);
      validPayload = isValidPayload_(data);
    } finally {
      timing.validationMs += elapsedMs_(validationStartedAt);
    }

    if (!validRequestId || !validPayload) {
      timing.outcome = "validation_error";
      return resultResponse_("error");
    }

    lock = LockService.getScriptLock();
    const lockStartedAt = Date.now();
    try {
      lockAcquired = lock.tryLock(LOCK_TIMEOUT_MS_);
    } finally {
      timing.lockWaitMs = elapsedMs_(lockStartedAt);
    }
    if (!lockAcquired) {
      timing.outcome = "lock_timeout";
      return resultResponse_("error");
    }

    const lookupStartedAt = Date.now();
    let sheet;
    let lastRow;
    let registrationValues;
    let duplicate;
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      sheet = spreadsheet.getSheetByName(TARGET_SHEET_NAME_);
      if (sheet && hasExpectedHeaders_(sheet)) {
        lastRow = sheet.getLastRow();
        registrationValues = registrationValues_(data);
        duplicate = hasExactDuplicate_(sheet, lastRow, registrationValues);
      }
    } finally {
      timing.lookupMs = elapsedMs_(lookupStartedAt);
    }

    if (!sheet || lastRow === undefined) {
      timing.outcome = "sheet_error";
      return resultResponse_("error");
    }

    timing.duplicate = duplicate;
    if (duplicate) {
      timing.outcome = "duplicate";
      return resultResponse_("success", true);
    }

    const targetRow = lastRow + 1;
    const appendStartedAt = Date.now();
    try {
      sheet.getRange(targetRow, 2, 1, 8).setNumberFormat("@");
      sheet.getRange(targetRow, 1, 1, 9).setValues([[
        new Date(),
        ...registrationValues
      ]]);
    } finally {
      timing.appendMs = elapsedMs_(appendStartedAt);
    }

    const flushStartedAt = Date.now();
    try {
      SpreadsheetApp.flush();
    } finally {
      timing.flushMs = elapsedMs_(flushStartedAt);
    }

    timing.outcome = "success";
    return resultResponse_("success", false);
  } catch (_error) {
    timing.outcome = "exception";
    return resultResponse_("error");
  } finally {
    try {
      if (lockAcquired && lock) {
        lock.releaseLock();
      }
    } catch (_error) {
      timing.outcome = "exception";
      throw _error;
    } finally {
      timing.totalMs = elapsedMs_(requestStartedAt);
      logTimingSummary_(timing);
    }
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== "string") {
    return null;
  }

  const contents = e.postData.contents;
  if (utf8ByteLength_(contents) > MAX_BODY_BYTES_) {
    return null;
  }

  let candidate;
  try {
    candidate = JSON.parse(contents);
  } catch (_error) {
    return null;
  }

  if (!isRecord_(candidate)) {
    return null;
  }

  const keys = Object.keys(candidate);
  if (
    keys.some((key) => ALLOWED_KEYS_.indexOf(key) === -1) ||
    REQUIRED_KEYS_.some((key) => !Object.prototype.hasOwnProperty.call(candidate, key))
  ) {
    return null;
  }

  return candidate;
}

function isValidOptionalRequestId_(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "requestId")) {
    return true;
  }

  return (
    typeof data.requestId === "string" &&
    data.requestId.length <= REQUEST_ID_MAX_LENGTH_ &&
    REQUEST_ID_PATTERN_.test(data.requestId)
  );
}

function normalizeAffiliation_(value) {
  return Object.prototype.hasOwnProperty.call(LEGACY_AFFILIATION_ALIASES_, value)
    ? LEGACY_AFFILIATION_ALIASES_[value]
    : value;
}

function isAuthorized_(providedToken) {
  const expectedToken = PropertiesService
    .getScriptProperties()
    .getProperty(TOKEN_PROPERTY_NAME_);

  if (!TOKEN_PATTERN_.test(providedToken) || !TOKEN_PATTERN_.test(expectedToken)) {
    return false;
  }

  const providedDigest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    providedToken,
    Utilities.Charset.UTF_8
  );
  const expectedDigest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    expectedToken,
    Utilities.Charset.UTF_8
  );
  let difference = providedDigest.length ^ expectedDigest.length;

  for (let index = 0; index < providedDigest.length; index += 1) {
    difference |= (providedDigest[index] & 255) ^ (expectedDigest[index] & 255);
  }

  return difference === 0;
}

function isValidPayload_(data) {
  return (
    isStringWithin_(data.name, 100) &&
    isStringWithin_(data.affiliationType, 50) &&
    ALLOWED_AFFILIATIONS_.indexOf(data.affiliationType) !== -1 &&
    isStringWithin_(data.orgName, 200) &&
    isStringWithin_(data.position, 100, false) &&
    isStringWithin_(data.phone, 20) &&
    PHONE_PATTERN_.test(data.phone) &&
    isStringWithin_(data.email, 254) &&
    EMAIL_PATTERN_.test(data.email) &&
    Array.isArray(data.sessions) &&
    data.sessions.length > 0 &&
    data.sessions.length <= ALLOWED_SESSIONS_.length &&
    data.sessions.every((session) =>
      typeof session === "string" && ALLOWED_SESSIONS_.indexOf(session) !== -1
    ) &&
    new Set(data.sessions).size === data.sessions.length &&
    !hasSessionSlotConflict_(data.sessions) &&
    data.consent === "agree"
  );
}

function hasSessionSlotConflict_(sessions) {
  const slots = sessions.map((session) => session.replace(/-t[12]$/, ""));
  return new Set(slots).size !== slots.length;
}

function isRecord_(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringWithin_(value, maxLength, required) {
  const isRequired = required === undefined ? true : required;
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (!isRequired || value.trim().length > 0)
  );
}

function hasExpectedHeaders_(sheet) {
  const headers = sheet.getRange(1, 1, 1, EXPECTED_HEADERS_.length).getValues()[0];
  return (
    Array.isArray(headers) &&
    headers.length === EXPECTED_HEADERS_.length &&
    headers.every((header, index) => header === EXPECTED_HEADERS_[index])
  );
}

function registrationValues_(data) {
  return [
    safeCellText_(data.name),
    safeCellText_(data.affiliationType),
    safeCellText_(data.orgName),
    safeCellText_(data.position),
    safeCellText_(data.phone),
    safeCellText_(data.email),
    safeCellText_(canonicalSessionText_(data.sessions)),
    safeCellText_(data.consent)
  ];
}

function hasExactDuplicate_(sheet, lastRow, candidateValues) {
  if (lastRow < 2) {
    return false;
  }

  const existingRows = sheet.getRange(2, 2, lastRow - 1, 8).getValues();
  const candidateKey = duplicateKey_(candidateValues);
  return existingRows.some((row) => duplicateKey_(normalizeStoredRow_(row)) === candidateKey);
}

function normalizeStoredRow_(row) {
  if (!Array.isArray(row) || row.length !== 8) {
    return null;
  }

  const sessions = String(row[6]).split(", ");
  if (
    sessions.length === 0 ||
    sessions.some((session) => ALLOWED_SESSIONS_.indexOf(session) === -1) ||
    new Set(sessions).size !== sessions.length
  ) {
    return null;
  }

  return [
    safeCellText_(String(row[0])),
    safeCellText_(normalizeAffiliation_(String(row[1]))),
    safeCellText_(String(row[2])),
    safeCellText_(String(row[3])),
    safeCellText_(String(row[4])),
    safeCellText_(String(row[5])),
    safeCellText_(canonicalSessionText_(sessions)),
    safeCellText_(String(row[7]))
  ];
}

function canonicalSessionText_(sessions) {
  return ALLOWED_SESSIONS_
    .filter((session) => sessions.indexOf(session) !== -1)
    .join(", ");
}

function duplicateKey_(values) {
  return Array.isArray(values) ? JSON.stringify(values) : null;
}

function safeCellText_(value) {
  const text = String(value);
  return /^[\s\x00-\x1F]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function utf8ByteLength_(value) {
  return Utilities.newBlob(value).getBytes().length;
}

function elapsedMs_(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function logTimingSummary_(timing) {
  const summary = {
    requestId: timing.requestId,
    authMs: timing.authMs,
    validationMs: timing.validationMs,
    lockWaitMs: timing.lockWaitMs,
    lookupMs: timing.lookupMs,
    appendMs: timing.appendMs,
    flushMs: timing.flushMs,
    totalMs: timing.totalMs,
    duplicate: timing.duplicate,
    outcome: timing.outcome
  };

  try {
    console.log(`[registration-timing] ${JSON.stringify(summary)}`);
  } catch (_error) {
    // Logging must never change the registration response contract.
  }
}

function resultResponse_(result, duplicate) {
  // ContentService cannot set a reliable custom HTTP status. The caller must
  // inspect this logical result and fail closed unless it is exactly "success".
  const body = { result };
  if (result === "success" && typeof duplicate === "boolean") {
    body.duplicate = duplicate;
  }

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
