"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Cpu, BarChart3, Settings, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/context";

const navLinks = [
  { href: "/", label: "Studio", icon: Cpu },
  { href: "/audit", label: "Audit Logs", icon: BarChart3 },
  { href: "/settings", label: "Rule Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold text-white tracking-tight">
                Shield<span className="text-emerald-400">AI</span>
              </span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 tracking-widest uppercase">
                Privacy Engine
              </p>
            </div>
          </Link>

          {/* Engine status badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">Engine: Local / Active</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <>
                <Link
                  href="/host/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname.startsWith("/host/dashboard")
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden lg:inline">Host Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/host/login"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/host/login"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden lg:inline">Host Login</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
