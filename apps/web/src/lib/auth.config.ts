import type { NextAuthConfig } from "next-auth";

// This config must stay free of Node-only imports (Prisma, bcrypt, etc.)
// because middleware runs on the Edge runtime. The full config with the
// actual Credentials.authorize() logic lives in auth.ts and is only ever
// loaded in real Node.js contexts (API routes, server components).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/voices", request.nextUrl));
      }

      if (!isLoggedIn && !isAuthPage) {
        return false; // triggers redirect to pages.signIn above
      }

      return true;
    },
  },
};
