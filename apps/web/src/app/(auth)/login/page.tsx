"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password");
      setIsSubmitting(false);
      return;
    }

    router.push("/voices");
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#151823] tracking-tight">
        Welcome back
      </h2>
      <p className="mt-1 text-sm text-[#6B7280]">
        Log in to manage your voices and generations.
      </p>

      {justRegistered && (
        <p className="mt-4 rounded-lg bg-[#ECFDF5] text-[#047857] text-sm px-3.5 py-2.5">
          Account created. Log in below to continue.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#151823]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#151823]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
            placeholder="Your password"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#DC2626]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#151823] text-white text-sm font-medium py-2.5 hover:bg-[#252A3A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[#151823] hover:text-[#2FD4C4]">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
