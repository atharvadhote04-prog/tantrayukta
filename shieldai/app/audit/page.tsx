"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import EntityBadge from "@/components/EntityBadge";

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

export default function AuditPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      setAuditLog(data);
    } catch {
      setAuditLog([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const entityTypes = ["ALL", ...Array.from(new Set(auditLog.map((e) => e.entityType)))];

  const filtered = auditLog
    .filter((e) => filterType === "ALL" || e.entityType === filterType)
    .filter((e) => filterStatus === "ALL" || e.validationStatus === filterStatus)
    .filter(
      (e) =>
        search === "" ||
        e.sourceName.toLowerCase().includes(search.toLowerCase()) ||
        e.entityType.toLowerCase().includes(search.toLowerCase()) ||
        e.actionTaken.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortAsc ? diff : -diff;
    });

  const exportCSV = () => {
    const header = "ID,Timestamp,Source,EntityType,Status,Action\n";
    const rows = filtered
      .map((e) =>
        [e.id, e.timestamp, e.sourceName, e.entityType, e.validationStatus, e.actionTaken]
          .map((v) => `"${v}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit_log.csv";
    a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit_log.json";
    a.click();
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete record of all detections and redaction actions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: auditLog.length, color: "text-white" },
          { label: "Valid", value: auditLog.filter((e) => e.validationStatus === "VALID").length, color: "text-emerald-400" },
          { label: "Invalid", value: auditLog.filter((e) => e.validationStatus === "INVALID").length, color: "text-red-400" },
          { label: "Filtered", value: filtered.length, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search source, type, action…"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
          >
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>
            ))}
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
        >
          <option value="ALL">All Status</option>
          <option value="VALID">Valid</option>
          <option value="INVALID">Invalid</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  <span className="flex items-center gap-1">
                    Timestamp
                    {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source / Document</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Checksum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-[200px] truncate" title={entry.sourceName}>
                      {entry.sourceName}
                    </td>
                    <td className="px-4 py-3">
                      <EntityBadge type={entry.entityType} count={1} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1 text-xs font-medium w-fit ${
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
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[220px] truncate" title={entry.actionTaken}>
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
