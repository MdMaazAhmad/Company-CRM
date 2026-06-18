import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="font-heading text-3xl font-bold text-ink">Workspace unavailable</h1>
        <p className="text-muted">
          This workspace is currently suspended or its subscription has lapsed. Please contact
          support to restore access.
        </p>
        <a
          href="mailto:webxhuntertech@gmail.com"
          className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Contact support
        </a>
        <div>
          <Link href="/login" className="text-sm text-muted hover:text-ink">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}