// ============================================================
// ShieldAI – In-Memory Store (mock database / audit log)
// ============================================================

import { DetectedEntity, DetectionRules, defaultRules } from "./validators";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  sourceName: string;
  entityType: string;
  entityValue: string;
  validationStatus: "VALID" | "INVALID" | "UNVERIFIED";
  actionTaken: string;
  mode: string;
}

export interface ProcessedDocument {
  id: string;
  timestamp: string;
  sourceName: string;
  entityCount: number;
  maskedCount: number;
  accuracy: number;
}

// ---- Seeded sample audit log entries ----
const SEED_ENTRIES: AuditLogEntry[] = [
  {
    id: "seed-001",
    timestamp: "2026-10-01T08:15:00Z",
    sourceName: "hr_payroll_oct2026.txt",
    entityType: "PAN",
    entityValue: "ABCDE1234F",
    validationStatus: "VALID",
    actionTaken: "Full Redaction → [REDACTED]",
    mode: "FULL",
  },
  {
    id: "seed-002",
    timestamp: "2026-10-01T08:15:00Z",
    sourceName: "hr_payroll_oct2026.txt",
    entityType: "MOBILE",
    entityValue: "+91 9876543210",
    validationStatus: "VALID",
    actionTaken: "Full Redaction → [REDACTED]",
    mode: "FULL",
  },
  {
    id: "seed-003",
    timestamp: "2026-10-01T08:15:00Z",
    sourceName: "hr_payroll_oct2026.txt",
    entityType: "BANK_ACCOUNT",
    entityValue: "912345678901",
    validationStatus: "VALID",
    actionTaken: "Full Redaction → [REDACTED]",
    mode: "FULL",
  },
  {
    id: "seed-004",
    timestamp: "2026-10-01T09:30:00Z",
    sourceName: "kyc_scan_rajesh.png",
    entityType: "AADHAAR",
    entityValue: "2345 6789 0123",
    validationStatus: "VALID",
    actionTaken: "Image Redaction – Black Box Burned",
    mode: "IMAGE",
  },
  {
    id: "seed-005",
    timestamp: "2026-10-01T09:30:00Z",
    sourceName: "kyc_scan_rajesh.png",
    entityType: "PAN",
    entityValue: "ABCDE1234F",
    validationStatus: "VALID",
    actionTaken: "Image Redaction – Black Box Burned",
    mode: "IMAGE",
  },
  {
    id: "seed-006",
    timestamp: "2026-10-02T11:00:00Z",
    sourceName: "chat_export_support.txt",
    entityType: "MOBILE",
    entityValue: "+91 9123456789",
    validationStatus: "VALID",
    actionTaken: "Entity Tag → [MASKED_MOBILE]",
    mode: "TAG",
  },
  {
    id: "seed-007",
    timestamp: "2026-10-02T11:00:00Z",
    sourceName: "chat_export_support.txt",
    entityType: "IFSC",
    entityValue: "HDFC0001234",
    validationStatus: "VALID",
    actionTaken: "Entity Tag → [MASKED_IFSC]",
    mode: "TAG",
  },
  {
    id: "seed-008",
    timestamp: "2026-10-02T14:45:00Z",
    sourceName: "invoice_oct_2026.pdf",
    entityType: "BANK_ACCOUNT",
    entityValue: "123456789012",
    validationStatus: "VALID",
    actionTaken: "Partial Mask → XXXXXXXX9012",
    mode: "PARTIAL",
  },
  {
    id: "seed-009",
    timestamp: "2026-10-03T07:00:00Z",
    sourceName: "employee_data_export.csv",
    entityType: "PAN",
    entityValue: "CDEGH5678K",
    validationStatus: "INVALID",
    actionTaken: "Skipped (Invalid checksum)",
    mode: "FULL",
  },
  {
    id: "seed-010",
    timestamp: "2026-10-03T09:15:00Z",
    sourceName: "loan_application.docx",
    entityType: "AADHAAR",
    entityValue: "3456 7890 1234",
    validationStatus: "VALID",
    actionTaken: "Full Redaction → [REDACTED]",
    mode: "FULL",
  },
];

// ---- Simple in-memory state ----
let auditLog: AuditLogEntry[] = [...SEED_ENTRIES];
let detectionRules: DetectionRules = { ...defaultRules };

let totalDocumentsProcessed = 3;
let totalEntitiesMasked = 8;

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}

export function addAuditEntries(
  entries: AuditLogEntry[]
): void {
  auditLog = [...auditLog, ...entries];
  totalDocumentsProcessed += 1;
  totalEntitiesMasked += entries.filter(
    (e) => e.validationStatus === "VALID"
  ).length;
}

export function getMetrics() {
  const valid = auditLog.filter((e) => e.validationStatus === "VALID").length;
  const total = auditLog.length;
  return {
    totalDocumentsProcessed,
    totalEntitiesMasked,
    checksumAccuracy: total > 0 ? Math.round((valid / total) * 100) : 100,
    activeRules: Object.values(detectionRules).filter(
      (v) => v === true
    ).length,
  };
}

export function getRules(): DetectionRules {
  return { ...detectionRules };
}

export function updateRules(newRules: Partial<DetectionRules>): void {
  detectionRules = { ...detectionRules, ...newRules };
}

// ---- Auth state ----
const ADMIN_USERNAME = "admin@shield.local";
const ADMIN_PASSWORD = "prarambh2026";
let isAuthenticated = false;

export function authenticate(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    isAuthenticated = true;
    return true;
  }
  return false;
}

export function getAuthState(): boolean {
  return isAuthenticated;
}

export function logout(): void {
  isAuthenticated = false;
}
