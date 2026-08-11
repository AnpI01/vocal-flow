import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// A separate, minimal NextAuth instance for middleware only - built from
// authConfig, which has no Prisma/bcrypt imports and is safe for the Edge
// runtime. The `authorized` callback in auth.config.ts handles all the
// redirect logic; nothing else is needed here.
export const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/login",
    "/register",
    "/voices/:path*",
    "/generate/:path*",
    "/history/:path*",
  ],
};
