import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Create a workspace · Web x Hunter",
};

export default async function SignupPage() {
  // Already signed in? No reason to create a second workspace from here.
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-5 py-16">
      <div className="mb-2 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#0A0A0A]">
          Web <span className="text-[#FF6B00]">x</span> Hunter
        </h1>
        <p className="mt-1 text-[#6B7280]">Create your workspace</p>
      </div>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-[#ECECEC] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <SignupForm />
      </div>

      <p className="mt-6 text-[#6B7280]">
        Already have a workspace?{" "}
        <Link href="/login" className="font-semibold text-[#FF6B00] hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}