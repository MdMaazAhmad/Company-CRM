// src/app/login/page.tsx
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="font-heading text-2xl font-extrabold tracking-tight text-ink">
            Web <span className="text-brand">x</span> Hunter
          </div>
          <p className="mt-1 text-sm text-muted">Sign in to your workspace</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New company?{" "}
          <a href="/signup" className="font-medium text-brand hover:underline">
            Create a workspace
          </a>
        </p>
      </div>
    </div>
  );
}