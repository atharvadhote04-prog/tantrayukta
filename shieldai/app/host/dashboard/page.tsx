"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context";
import {
  FileText,
  Shield,
  CheckCircle2,
  Activity,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  sourceName: string;
  entityType: string;
  entityValue: string;
  validationStatus: "VALID" | "INVALID" | "UNVERIFIED";
  actionTaken: string;
  mode: string;
}

interface Metrics {
  totalDocumentsProcessed: number;
  totalEntitiesMasked: number;
  checksumAccuracy: number;
  activeRules: number;
}

const TYPE_COLORS: Record<string, string> = {
  PAN: "text-red-400 bg-red-500/10 border-red-500/20",
  AADHAAR: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  MOBILE: "text-green-400 bg-green-500/10 border-green-500/20",
  BANK_ACCOUNT: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  IFSC: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  CARD: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

export default function HostDashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics>({
    totalDocumentsProcessed: 0,
    totalEntitiesMasked: 0,
    checksumAccuracy: 0,
    activeRules: 0,
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/host/login");
    }
  }, [isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/audit"),
      ]);
      const m = await mRes.json();
      const a = await aRes.json();
      setMetrics(m);
      setAuditLog(a);
    } catch {
      // offline fallback — use seed data directly
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  // Filter + sort
  const filtered = auditLog
    .filter((e) => filterType === "ALL" || e.entityType === filterType)
    .filter((e) => filterStatus === "ALL" || e.validationStatus === filterStatus)
    .sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortAsc ? diff : -diff;
    });

  const entityTypes = ["ALL", ...Array.from(new Set(auditLog.map((e) => e.entityType)))];

  const exportCSV = () => {
    const header = "ID,Timestamp,Source,EntityType,EntityValue,Status,Action\n";
    const rows = filtered
      .map((e) =>
        [e.id, e.timestamp, e.sourceName, e.entityType, e.entityValue, e.validationStatus, e.actionTaken]
          .map((v) => `"${v}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shieldai_audit_log.csv";
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shieldai_audit_log.json";
    a.click();
  };

  const METRIC_CARDS = [
    {
      label: "Documents Processed",
      value: metrics.totalDocumentsProcessed,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Entities Masked",
      value: metrics.totalEntitiesMasked,
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Checksum Accuracy",
      value: `${metrics.checksumAccuracy}%`,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      label: "Active Rules",
      value: metrics.activeRules,
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Host Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Compliance management & audit oversight</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Switch to User Studio
          </a>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map((card) => (
          <div
            key={card.label}
            className={`glass-card rounded-xl p-5 border ${card.border} flex flex-col gap-3`}
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Global Audit Log
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({filtered.length} entries)
            </span>
          </h2>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-600"
              >
                {entityTypes.map((t) => (
                  <option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-600"
            >
              <option value="ALL">All Status</option>
              <option value="VALID">Valid</option>
              <option value="INVALID">Invalid</option>
            </select>

            {/* Export buttons */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  <span className="flex items-center gap-1">
                    Timestamp
                    {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value (Masked)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Checksum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
                      Loading audit log…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-[180px] truncate" title={entry.sourceName}>
                      {entry.sourceName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          TYPE_COLORS[entry.entityType] ?? "text-slate-400 bg-slate-800 border-slate-700"
                        }`}
                      >
                        {entry.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {"*".repeat(Math.min(entry.entityValue.length - 4, 8))}
                      {entry.entityValue.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          entry.validationStatus === "VALID"
                            ? "text-emerald-400"
                            : entry.validationStatus === "INVALID"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            entry.validationStatus === "VALID"
                              ? "bg-emerald-400"
                              : entry.validationStatus === "INVALID"
                              ? "bg-red-400"
                              : "bg-amber-400"
                          }`}
                        />
                        {entry.validationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate" title={entry.actionTaken}>
                      {entry.actionTaken}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
