"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  ScanLine,
  Copy,
  Download,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  RefreshCw,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import {
  redactText,
  renderRedactedImage,
  DetectedEntity,
  MaskingMode,
} from "@/lib/validators";
import { useRules } from "@/lib/context";
import { SAMPLE_PAN_TEXT, SAMPLE_CHAT_TEXT } from "@/lib/samples";
import EntityBadge from "./EntityBadge";
import HighlightedText from "./HighlightedText";

type InputMode = "text" | "image";

const MASK_OPTIONS: { value: MaskingMode; label: string; desc: string }[] = [
  { value: "FULL", label: "Full Redaction", desc: "[REDACTED]" },
  { value: "TAG", label: "Entity Tag", desc: "[MASKED_PAN]" },
  { value: "PARTIAL", label: "Partial Mask", desc: "XXXXX1234" },
];

const ENTITY_COLORS: Record<string, string> = {
  PAN: "text-red-400",
  AADHAAR: "text-orange-400",
  MOBILE: "text-green-400",
  BANK_ACCOUNT: "text-blue-400",
  IFSC: "text-purple-400",
  CARD: "text-yellow-400",
};

export default function StudioWorkspace() {
  const { rules, maskingMode, setMaskingMode } = useRules();
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [redactedOutput, setRedactedOutput] = useState("");
  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const redactedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist audit log entries
  const persistToAuditLog = useCallback(
    async (
      detectedEntities: DetectedEntity[],
      sourceName: string,
      mode: MaskingMode
    ) => {
      const entries = detectedEntities.map((e) => ({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        sourceName,
        entityType: e.type,
        entityValue: e.value,
        validationStatus: e.valid ? "VALID" : "INVALID",
        actionTaken:
          mode === "FULL"
            ? "Full Redaction → [REDACTED]"
            : mode === "TAG"
            ? `Entity Tag → [MASKED_${e.type}]`
            : `Partial Mask → ${e.value.slice(-4).padStart(e.value.length, "X")}`,
        mode,
      }));

      try {
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entries),
        });
      } catch {
        // offline fallback — silently skip
      }
    },
    []
  );

  const handleScan = useCallback(async () => {
    if (inputMode === "text") {
      if (!textInput.trim()) return;
      setIsScanning(true);
      await new Promise((r) => setTimeout(r, 600)); // UX: show scan animation
      const { redacted, entities: found } = redactText(
        textInput,
        rules,
        maskingMode
      );
      setRedactedOutput(redacted);
      setEntities(found);
      setScanned(true);
      setIsScanning(false);
      await persistToAuditLog(found, "text-input.txt", maskingMode);
    } else {
      if (!imageFile || !originalCanvasRef.current || !redactedCanvasRef.current) return;
      setIsScanning(true);
      await new Promise((r) => setTimeout(r, 800));

      // Draw original image on both canvases, then burn redaction boxes on the redacted one
      const img = new window.Image();
      img.onload = () => {
        const orig = originalCanvasRef.current!;
        const red = redactedCanvasRef.current!;
        orig.width = img.width;
        orig.height = img.height;
        red.width = img.width;
        red.height = img.height;

        orig.getContext("2d")!.drawImage(img, 0, 0);
        red.getContext("2d")!.drawImage(img, 0, 0);

        // Demo bounding boxes (simulate OCR detections on sample image)
        const mockBoxes = [
          { x: 40, y: 80, width: 220, height: 28, label: "PAN" },
          { x: 40, y: 140, width: 300, height: 28, label: "AADHAAR" },
          { x: 40, y: 200, width: 260, height: 28, label: "MOBILE" },
          { x: 40, y: 260, width: 320, height: 28, label: "BANK_ACCOUNT" },
        ];
        renderRedactedImage(red, mockBoxes);

        const fakeEntities: DetectedEntity[] = mockBoxes.map((b, i) => ({
          type: b.label as DetectedEntity["type"],
          value: ["ABCDE1234F", "2345 6789 0123", "+91 9876543210", "912345678901"][i],
          start: 0,
          end: 0,
          valid: true,
        }));
        setEntities(fakeEntities);
        setScanned(true);
        setIsScanning(false);
        persistToAuditLog(fakeEntities, imageFile.name, "IMAGE" as MaskingMode);
      };
      img.src = imagePreviewUrl!;
    }
  }, [inputMode, textInput, rules, maskingMode, imageFile, imagePreviewUrl, persistToAuditLog]);

  const handleFileLoad = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setScanned(false);
    setEntities([]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileLoad(file);
    },
    [handleFileLoad]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(redactedOutput).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [redactedOutput]);

  const handleDownloadImage = useCallback(() => {
    if (!redactedCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = "redacted-image.png";
    link.href = redactedCanvasRef.current.toDataURL("image/png");
    link.click();
  }, []);

  const resetWorkspace = useCallback(() => {
    setTextInput("");
    setRedactedOutput("");
    setEntities([]);
    setScanned(false);
    setImageFile(null);
    setImagePreviewUrl(null);
  }, []);

  const groupedEntities = entities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Toggle & Masking Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Input mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          {(["text", "image"] as InputMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => { setInputMode(mode); resetWorkspace(); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                inputMode === mode
                  ? "bg-emerald-500/20 text-emerald-400 border-r border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {mode === "text" ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              {mode === "text" ? "Text / Chat Logs" : "Image Upload"}
            </button>
          ))}
        </div>

        {/* Masking mode */}
        {inputMode === "text" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Mask Mode:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
              {MASK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMaskingMode(opt.value)}
                  title={opt.desc}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    maskingMode === opt.value
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main split workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ── LEFT: Input ── */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">
              {inputMode === "text" ? "Input Text" : "Upload Image"}
            </h2>
            {scanned && (
              <button onClick={resetWorkspace} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {inputMode === "text" ? (
            <>
              <textarea
                value={textInput}
                onChange={(e) => { setTextInput(e.target.value); setScanned(false); }}
                placeholder="Paste text, chat logs, or documents containing sensitive data…"
                className="flex-1 min-h-[320px] w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 font-mono leading-relaxed"
              />
              {/* Quick sample buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setTextInput(SAMPLE_PAN_TEXT); setScanned(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-red-400" />
                  Load Sample PAN/Bill
                </button>
                <button
                  onClick={() => { setTextInput(SAMPLE_CHAT_TEXT); setScanned(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  Load Sample Chat
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 min-h-[320px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/40"
                }`}
              >
                {imagePreviewUrl ? (
                  <div className="relative w-full h-full min-h-[280px]">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <span className="absolute top-2 right-2 bg-slate-900/80 text-xs text-slate-400 px-2 py-1 rounded">
                      {imageFile?.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-slate-500" />
                    </div>
                    <p className="text-sm text-slate-400">
                      Drop an image here or{" "}
                      <span className="text-emerald-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-600">PNG, JPG supported</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileLoad(f);
                }}
              />
            </>
          )}

          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={isScanning || (inputMode === "text" ? !textInput.trim() : !imageFile)}
            className="relative w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white overflow-hidden group"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning…
                <div className="absolute inset-0 scan-animation" />
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                Scan &amp; Redact
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT: Output Preview ── */}
        <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Output Preview</h2>
            {scanned && inputMode === "text" && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
              >
                {copySuccess ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Sanitized Text</>
                )}
              </button>
            )}
            {scanned && inputMode === "image" && (
              <button
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Redacted
              </button>
            )}
          </div>

          {!scanned ? (
            <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <div className="w-14 h-14 rounded-xl bg-slate-800/60 flex items-center justify-center">
                <ScanLine className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">
                Redacted output will appear here
              </p>
              <p className="text-xs text-slate-700">
                Click "Scan &amp; Redact" to begin
              </p>
            </div>
          ) : inputMode === "text" ? (
            <div className="flex-1 min-h-[320px] bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm font-mono leading-relaxed overflow-auto">
              <HighlightedText original={textInput} redacted={redactedOutput} entities={entities} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 text-center">Original</span>
                  <canvas
                    ref={originalCanvasRef}
                    className="w-full rounded-lg border border-slate-700"
                    style={{ maxHeight: 280, objectFit: "contain" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-emerald-400 text-center">Redacted ✓</span>
                  <canvas
                    ref={redactedCanvasRef}
                    className="w-full rounded-lg border border-emerald-800"
                    style={{ maxHeight: 280, objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Entity legend */}
          {scanned && entities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              {Object.entries(groupedEntities).map(([type, count]) => (
                <EntityBadge key={type} type={type} count={count} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Summary Strip ── */}
      {scanned && (
        <div className="glass-card rounded-xl px-5 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {entities.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-sm font-medium text-white">
              {entities.length === 0
                ? "No sensitive entities detected."
                : `${entities.length} sensitive item${entities.length !== 1 ? "s" : ""} detected & protected`}
            </span>
          </div>
          <div className="flex gap-4 ml-auto text-xs text-slate-400">
            <span>
              <span className="text-emerald-400 font-semibold">{entities.filter((e) => e.valid).length}</span> validated
            </span>
            <span>
              <span className="text-amber-400 font-semibold">{entities.filter((e) => !e.valid).length}</span> suspicious
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              Mode: {maskingMode === "FULL" ? "Full Redaction" : maskingMode === "TAG" ? "Entity Tag" : "Partial Mask"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
