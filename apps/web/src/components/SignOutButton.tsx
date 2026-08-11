"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-medium text-[#4B5262] hover:text-[#151823]"
    >
      Log out
    </button>
  );
}
