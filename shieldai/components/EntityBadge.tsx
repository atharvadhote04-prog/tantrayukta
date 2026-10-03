"use client";

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PAN:          { bg: "bg-red-500/10",     text: "text-red-400",    border: "border-red-500/30" },
  AADHAAR:      { bg: "bg-orange-500/10",  text: "text-orange-400", border: "border-orange-500/30" },
  MOBILE:       { bg: "bg-green-500/10",   text: "text-green-400",  border: "border-green-500/30" },
  BANK_ACCOUNT: { bg: "bg-blue-500/10",    text: "text-blue-400",   border: "border-blue-500/30" },
  IFSC:         { bg: "bg-purple-500/10",  text: "text-purple-400", border: "border-purple-500/30" },
  CARD:         { bg: "bg-yellow-500/10",  text: "text-yellow-400", border: "border-yellow-500/30" },
};

const LABELS: Record<string, string> = {
  PAN: "PAN",
  AADHAAR: "Aadhaar",
  MOBILE: "Mobile",
  BANK_ACCOUNT: "Bank A/C",
  IFSC: "IFSC",
  CARD: "Card",
};

interface Props {
  type: string;
  count: number;
}

export default function EntityBadge({ type, count }: Props) {
  const c = COLORS[type] ?? { bg: "bg-slate-800", text: "text-slate-400", border: "border-slate-700" };
  return (
    <span
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace("text-", "bg-")}`} />
      {LABELS[type] ?? type}
      <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
    </span>
  );
}
