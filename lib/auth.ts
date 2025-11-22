import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const config = {
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user[0].password);

        if (!isPasswordValid) {
          return null;
        }

        if (!user[0].isApproved) {
          return null; // User not approved yet
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          role: user[0].role,
          isApproved: user[0].isApproved,
          image: user[0].avatar,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = user.role;
        token.isApproved = user.isApproved;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.isApproved = token.isApproved;
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    signOut: "/",
  },
};

import NextAuth from 'next-auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { auth, handlers } = (NextAuth as any)(config);