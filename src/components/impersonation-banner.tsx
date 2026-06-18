"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { stopImpersonating } from "@/lib/superadmin-actions";

export function ImpersonationBanner({ orgName }: { orgName: string }) {
  const [pending, start] = useTransition();
  function exit() {
    start(async () => {
      await stopImpersonating();
      window.location.href = "/superadmin";
    });
  }
  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-1.5 text-sm font-medium text-amber-950">
      Acting as <span className="font-semibold">{orgName}</span>
      <button onClick={exit} disabled={pending} className="inline-flex items-center gap-1 rounded-md bg-amber-950/10 px-2 py-0.5 hover:bg-amber-950/20">
        <LogOut size={12} /> Exit
      </button>
    </div>
  );
}