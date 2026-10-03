import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, RulesProvider } from "@/lib/context";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShieldAI – Personal Data Privacy Shield",
  description:
    "Detect, validate, and redact sensitive personal identifiers from text and images.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <AuthProvider>
          <RulesProvider>
            <Navbar />
            <main>{children}</main>
          </RulesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
