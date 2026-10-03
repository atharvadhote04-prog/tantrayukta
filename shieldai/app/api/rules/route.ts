import { NextResponse } from "next/server";
import { getRules, updateRules } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getRules());
}

export async function POST(req: Request) {
  try {
    const patch = await req.json();
    updateRules(patch);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
