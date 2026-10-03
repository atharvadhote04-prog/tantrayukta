import StudioWorkspace from "@/components/StudioWorkspace";
import { Shield, Zap, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Privacy Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Detect and redact sensitive identifiers from text and images in real-time.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap className="w-3 h-3" /> PAN • Aadhaar • Mobile
          </span>
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Lock className="w-3 h-3" /> IFSC • Bank A/C • Cards
          </span>
        </div>
      </div>

      {/* The full studio */}
      <StudioWorkspace />
    </div>
  );
}
