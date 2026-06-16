"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { createWorkspace, type SignupResult } from "@/lib/signup-actions";

// Pull the `field` type straight off the error member of the result union.
// NonNullable strips the `undefined` that the optional `?` adds.
type SignupError = Extract<SignupResult, { ok: false }>;
type FieldErr = NonNullable<SignupError["field"]>;

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<FieldErr | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setField(null);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const res = await createWorkspace(formData);
      if (!res.ok) {
        setError(res.error);
        setField(res.field ?? null);
        return;
      }
      // Workspace created — sign the new owner in and land on the dashboard.
      const login = await signIn("credentials", {
        email: res.email,
        password,
        redirect: false,
      });
      if (login?.error) {
        // Account exists but auto-login failed — send them to login.
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  const errFor = (f: FieldErr) =>
    field === f ? "border-[#FF6B00] focus:border-[#FF6B00]" : "";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        label="Company name"
        name="company"
        type="text"
        placeholder="Web x Hunter"
        autoComplete="organization"
        className={errFor("company")}
      />
      <Field
        label="Your name"
        name="name"
        type="text"
        placeholder="Maaz"
        autoComplete="name"
        className={errFor("name")}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        className={errFor("email")}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        className={errFor("password")}
      />

      {error && (
        <p className="text-sm text-[#DB2777] -mt-1" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-xl bg-[#FF6B00] py-3 text-sm font-semibold text-white transition hover:bg-[#e85f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pending ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}

function Field({
  label,
  className = "",
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <input
        {...props}
        required
        className={`rounded-xl border border-[#E5E7EB] bg-[#EEF2FF]/40 px-4 py-3 text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#FF6B00] focus:bg-white ${className}`}
      />
    </label>
  );
}