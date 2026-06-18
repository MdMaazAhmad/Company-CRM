"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { PasswordInput } from "@/components/password-input";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid credentials.");
        return;
      }
      const me = await fetch("/api/auth/session").then((r) => r.json());
      if (!me?.user?.isSuperAdmin) {
        setError("This account is not a super admin.");
        return;
      }
      window.location.href = "/superadmin";
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-8">
        <div className="mb-6 flex items-center gap-2 text-white">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <span className="font-heading text-lg font-semibold">Super Admin</span>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e:any) => setPassword(e.target.value)}
            onKeyDown={(e:any) => e.key === "Enter" && submit()}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={pending || !email || !password}
            className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}