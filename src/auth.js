import bcrypt from "bcryptjs";
import NextAuth, { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import User, { formatStudentName } from "@/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const secret = process.env.AUTH_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
}

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const authOptions = {
  secret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const clientIp = getClientIp(request);
        const limit = checkRateLimit(
          `login:${clientIp}:${parsed.data.email}`,
          10,
          15 * 60 * 1000,
        );
        if (!limit.allowed) {
          return null;
        }

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email }).select(
          "+passwordHash",
        );
        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: formatStudentName(user.name),
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);

export const handlers = {
  GET: authHandler,
  POST: authHandler,
};

export function auth() {
  return getServerSession(authOptions);
}

export { signIn, signOut } from "next-auth/react";