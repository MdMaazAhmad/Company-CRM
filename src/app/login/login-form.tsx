"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/password-input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.status === 429) {
        setError("Too many login attempts. Please wait a minute and try again.");
        return;
      }
      if (res?.error) {
        setError("Wrong email or password.");
        return;
      }
      router.push(from);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
          placeholder="you@company.com"
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted">Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={pending}
        className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </div>
  );
}