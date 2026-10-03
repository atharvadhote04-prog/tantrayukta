import { NextResponse } from "next/server";
import { getAuditLog, addAuditEntries, AuditLogEntry } from "@/lib/store";

export async function GET() {
  const log = getAuditLog();
  return NextResponse.json(log);
}

export async function POST(req: Request) {
  try {
    const entries: AuditLogEntry[] = await req.json();
    addAuditEntries(entries);
    return NextResponse.json({ success: true, count: entries.length });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
