"use client";

import { useState } from "react";
import { useRules } from "@/lib/context";
import {
  Settings,
  Shield,
  CreditCard,
  Phone,
  Building2,
  ChevronRight,
  Plus,
  X,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Info,
} from "lucide-react";
import { DetectionRules } from "@/lib/validators";

type Strictness = "STANDARD" | "BALANCED" | "AGGRESSIVE";

const STRICTNESS_OPTIONS: { value: Strictness; label: string; desc: string; color: string }[] = [
  {
    value: "STANDARD",
    label: "Standard",
    desc: "Regex + checksum validation — lowest false positives",
    color: "emerald",
  },
  {
    value: "BALANCED",
    label: "Balanced",
    desc: "Syntax + proximity keywords (A/C, Mob, ID)",
    color: "blue",
  },
  {
    value: "AGGRESSIVE",
    label: "Aggressive",
    desc: "Regex only — catches everything, may over-redact",
    color: "red",
  },
];

interface ToggleRule {
  key: keyof DetectionRules;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  subToggle?: { key: keyof DetectionRules; label: string };
}

const RULES: ToggleRule[] = [
  {
    key: "aadhaar",
    label: "Indian National Identity Numbers (Aadhaar)",
    description: "Detects 12-digit national IDs with optional space/dash separators.",
    icon: Shield,
    iconColor: "text-orange-400",
    subToggle: { key: "verhoeffCheck", label: "Enable Verhoeff checksum validation" },
  },
  {
    key: "pan",
    label: "Permanent Account Number (PAN)",
    description: "Detects 10-character alphanumeric PAN cards issued by the Income Tax Dept.",
    icon: CreditCard,
    iconColor: "text-red-400",
    subToggle: { key: "panCharCheck", label: "Verify 4th character taxpayer code" },
  },
  {
    key: "bankAccount",
    label: "Bank Account Numbers",
    description: "Detects 9–18 digit bank account numbers.",
    icon: Building2,
    iconColor: "text-blue-400",
  },
  {
    key: "ifsc",
    label: "IFSC Codes",
    description: "Detects 11-character RBI IFSC routing codes for Indian banks.",
    icon: Building2,
    iconColor: "text-purple-400",
  },
  {
    key: "mobile",
    label: "10-Digit Mobile Numbers (+91)",
    description: "Detects Indian mobile numbers with or without the +91 country code.",
    icon: Phone,
    iconColor: "text-green-400",
  },
  {
    key: "card",
    label: "Payment Card Numbers",
    description: "Detects 16-digit payment card numbers and validates with Luhn algorithm.",
    icon: CreditCard,
    iconColor: "text-yellow-400",
  },
];

export default function SettingsPage() {
  const { rules, updateRules } = useRules();
  const [newKeyword, setNewKeyword] = useState("");

  const toggle = (key: keyof DetectionRules) => {
    updateRules({ [key]: !rules[key] } as Partial<DetectionRules>);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || rules.customKeywords.includes(kw)) return;
    updateRules({ customKeywords: [...rules.customKeywords, kw] });
    setNewKeyword("");
  };

  const removeKeyword = (kw: string) => {
    updateRules({ customKeywords: rules.customKeywords.filter((k) => k !== kw) });
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Detection Rules & Sensitivity Engine
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure which entity types to scan for and how aggressively.
        </p>
      </div>

      {/* Entity Detector Toggles */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Entity Detectors
          </h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {RULES.map((rule) => {
            const enabled = !!rules[rule.key];
            return (
              <div key={rule.key as string} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0`}>
                      <rule.icon className={`w-4 h-4 ${rule.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{rule.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(rule.key)}
                    className="flex-shrink-0 mt-0.5 transition-colors"
                  >
                    {enabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Sub-toggle */}
                {rule.subToggle && enabled && (
                  <div className="ml-11 flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2.5">
                    <span className="text-xs text-slate-400">{rule.subToggle.label}</span>
                    <button onClick={() => toggle(rule.subToggle!.key)}>
                      {rules[rule.subToggle.key] ? (
                        <ToggleRight className="w-6 h-6 text-blue-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strictness Selector */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Detection Strictness
          </h2>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {STRICTNESS_OPTIONS.map((opt) => {
            const selected = rules.strictness === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateRules({ strictness: opt.value })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selected
                    ? `border-${opt.color}-500/40 bg-${opt.color}-500/10`
                    : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/60"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected
                      ? `border-${opt.color}-400`
                      : "border-slate-600"
                  }`}
                >
                  {selected && (
                    <div className={`w-2.5 h-2.5 rounded-full bg-${opt.color}-400`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${selected ? "text-white" : "text-slate-400"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
                {selected && <ChevronRight className={`w-4 h-4 text-${opt.color}-400`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Keywords */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-400" />
            Custom Sensitive Keywords
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Add domain-specific terms (e.g., "Salary", "EmployeeID") to flag in proximity detection.
          </p>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder='e.g. "Salary", "EmployeeID"…'
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
            <button
              onClick={addKeyword}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Add
            </button>
          </div>

          {/* Chip list */}
          <div className="flex flex-wrap gap-2">
            {rules.customKeywords.length === 0 ? (
              <span className="text-xs text-slate-600 italic">No custom keywords added yet.</span>
            ) : (
              rules.customKeywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 bg-slate-800/40 rounded-lg px-4 py-3">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              Custom keywords are used in <strong className="text-slate-400">Balanced</strong> and{" "}
              <strong className="text-slate-400">Aggressive</strong> modes to detect numbers appearing near these terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
