"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#151823] tracking-tight">
        Create your account
      </h2>
      <p className="mt-1 text-sm text-[#6B7280]">
        Start cloning voices and generating audio.
      </p>

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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#151823]">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#D6DAE3] bg-white px-3.5 py-2.5 text-sm text-[#151823] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 focus:ring-[#2FD4C4] focus:border-transparent"
            placeholder="Repeat your password"
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#151823] hover:text-[#2FD4C4]">
          Log in
        </Link>
      </p>
    </div>
  );
}
