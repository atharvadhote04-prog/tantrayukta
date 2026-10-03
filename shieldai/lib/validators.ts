// ============================================================
// ShieldAI – Core Validation & Detection Engine
// ============================================================

// ----------------------------------------------------------------
// 1. Verhoeff Algorithm – validates 12-digit Aadhaar numbers
// ----------------------------------------------------------------
const d_table: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p_table: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const inv_table: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function validateVerhoeff(numStr: string): boolean {
  const digits = numStr.split("").reverse().map(Number);
  if (digits.some(isNaN)) return false;
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = d_table[c][p_table[i % 8][digits[i]]];
  }
  return c === 0;
}

// ----------------------------------------------------------------
// 2. PAN Validation
// ----------------------------------------------------------------
const PAN_TAXPAYER_CODES = ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"];

export function validatePAN(panStr: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panStr)) return false;
  return PAN_TAXPAYER_CODES.includes(panStr[3]);
}

// ----------------------------------------------------------------
// 3. IFSC Validation
// ----------------------------------------------------------------
export function validateIFSC(ifscStr: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscStr);
}

// ----------------------------------------------------------------
// 4. Luhn Algorithm – validates payment card numbers
// ----------------------------------------------------------------
export function validateLuhn(cardStr: string): boolean {
  const digits = cardStr.replace(/\s+/g, "").split("").reverse().map(Number);
  if (digits.some(isNaN) || digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// ----------------------------------------------------------------
// 5. Mobile Number Validation (Indian)
// ----------------------------------------------------------------
export function validateMobile(mobile: string): boolean {
  return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(mobile.replace(/\s/g, ""));
}

// ----------------------------------------------------------------
// 6. Bank Account Validation (basic length + numeric check)
// ----------------------------------------------------------------
export function validateBankAccount(acc: string): boolean {
  const clean = acc.replace(/\s/g, "");
  return /^\d{9,18}$/.test(clean);
}

// ----------------------------------------------------------------
// Entity Types
// ----------------------------------------------------------------
export type EntityType =
  | "AADHAAR"
  | "PAN"
  | "BANK_ACCOUNT"
  | "IFSC"
  | "MOBILE"
  | "CARD";

export interface DetectedEntity {
  type: EntityType;
  value: string;
  start: number;
  end: number;
  valid: boolean;
}

export type MaskingMode = "FULL" | "TAG" | "PARTIAL";

export interface DetectionRules {
  aadhaar: boolean;
  pan: boolean;
  bankAccount: boolean;
  ifsc: boolean;
  mobile: boolean;
  card: boolean;
  verhoeffCheck: boolean;
  panCharCheck: boolean;
  customKeywords: string[];
  strictness: "STANDARD" | "BALANCED" | "AGGRESSIVE";
}

export const defaultRules: DetectionRules = {
  aadhaar: true,
  pan: true,
  bankAccount: true,
  ifsc: true,
  mobile: true,
  card: true,
  verhoeffCheck: true,
  panCharCheck: true,
  customKeywords: [],
  strictness: "STANDARD",
};

// ----------------------------------------------------------------
// 7. redactText – main scanning + masking function
// ----------------------------------------------------------------
export function redactText(
  input: string,
  rules: DetectionRules,
  mode: MaskingMode
): { redacted: string; entities: DetectedEntity[] } {
  const entities: DetectedEntity[] = [];

  // Pattern registry
  const patterns: {
    type: EntityType;
    regex: RegExp;
    validate: (v: string) => boolean;
    enabled: boolean;
  }[] = [
    {
      type: "AADHAAR",
      regex: /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
      validate: (v) => {
        const clean = v.replace(/[\s-]/g, "");
        if (clean.length !== 12) return false;
        if (rules.verhoeffCheck) return validateVerhoeff(clean);
        return true;
      },
      enabled: rules.aadhaar,
    },
    {
      type: "PAN",
      regex: /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/g,
      validate: (v) => {
        if (rules.panCharCheck) return validatePAN(v);
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      enabled: rules.pan,
    },
    {
      type: "IFSC",
      regex: /\b([A-Z]{4}0[A-Z0-9]{6})\b/g,
      validate: validateIFSC,
      enabled: rules.ifsc,
    },
    {
      type: "BANK_ACCOUNT",
      regex: /\b(\d{9,18})\b/g,
      validate: validateBankAccount,
      enabled: rules.bankAccount,
    },
    {
      type: "MOBILE",
      regex: /(\+91[\s-]?[6-9]\d{9}|[6-9]\d{9})\b/g,
      validate: validateMobile,
      enabled: rules.mobile,
    },
    {
      type: "CARD",
      regex: /\b(\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})\b/g,
      validate: (v) => validateLuhn(v.replace(/[\s-]/g, "")),
      enabled: rules.card,
    },
  ];

  // Collect all matches with their positions
  for (const { type, regex, validate, enabled } of patterns) {
    if (!enabled) continue;
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;
      const valid =
        rules.strictness === "AGGRESSIVE" ? true : validate(value);

      // In STANDARD mode skip invalid; in BALANCED/AGGRESSIVE include
      if (rules.strictness === "STANDARD" && !valid) continue;

      entities.push({ type, value, start, end, valid });
    }
  }

  // Sort by start position and deduplicate overlaps
  entities.sort((a, b) => a.start - b.start);
  const deduped: DetectedEntity[] = [];
  let lastEnd = -1;
  for (const e of entities) {
    if (e.start >= lastEnd) {
      deduped.push(e);
      lastEnd = e.end;
    }
  }

  // Build redacted string
  let result = "";
  let cursor = 0;
  for (const e of deduped) {
    result += input.slice(cursor, e.start);
    result += getMask(e.value, e.type, mode);
    cursor = e.end;
  }
  result += input.slice(cursor);

  return { redacted: result, entities: deduped };
}

function getMask(value: string, type: EntityType, mode: MaskingMode): string {
  switch (mode) {
    case "FULL":
      return "[REDACTED]";
    case "TAG":
      return `[MASKED_${type}]`;
    case "PARTIAL": {
      const clean = value.replace(/[\s-]/g, "");
      const last4 = clean.slice(-4);
      const masked = "X".repeat(Math.max(0, clean.length - 4));
      return `${masked}${last4}`;
    }
  }
}

// ----------------------------------------------------------------
// 8. renderRedactedImage – burns black boxes on canvas
// ----------------------------------------------------------------
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export function renderRedactedImage(
  canvas: HTMLCanvasElement,
  boundingBoxes: BoundingBox[]
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000000";
  for (const box of boundingBoxes) {
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }
}
