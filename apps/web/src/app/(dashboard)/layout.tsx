import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <header className="border-b border-[#E3E6EC] bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-semibold tracking-tight text-[#151823]">Vocal Flow</span>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/voices" className="text-[#4B5262] hover:text-[#151823]">
                Voices
              </Link>
              <Link href="/generate" className="text-[#4B5262] hover:text-[#151823]">
                Generate
              </Link>
              <Link href="/history" className="text-[#4B5262] hover:text-[#151823]">
                History
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9AA1B2]">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
