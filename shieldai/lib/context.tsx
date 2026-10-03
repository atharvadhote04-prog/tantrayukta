"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  DetectionRules,
  defaultRules,
  MaskingMode,
} from "@/lib/validators";

// ---- Auth Context ----
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const ADMIN_USERNAME = "admin@shield.local";
const ADMIN_PASSWORD = "prarambh2026";

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback((username: string, password: string) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setIsAuthenticated(false), []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ---- Rules Context ----
interface RulesContextType {
  rules: DetectionRules;
  updateRules: (patch: Partial<DetectionRules>) => void;
  maskingMode: MaskingMode;
  setMaskingMode: (m: MaskingMode) => void;
}

const RulesContext = createContext<RulesContextType>({
  rules: defaultRules,
  updateRules: () => {},
  maskingMode: "FULL",
  setMaskingMode: () => {},
});

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<DetectionRules>(defaultRules);
  const [maskingMode, setMaskingMode] = useState<MaskingMode>("FULL");

  const updateRules = useCallback((patch: Partial<DetectionRules>) => {
    setRules((r) => ({ ...r, ...patch }));
  }, []);

  return (
    <RulesContext.Provider value={{ rules, updateRules, maskingMode, setMaskingMode }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules() {
  return useContext(RulesContext);
}
