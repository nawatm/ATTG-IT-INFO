import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";
import { isAuthConfigured, isIdentityConfigured } from "@/lib/auth-config";
import { authenticateLocal } from "@/lib/local-login";
const directoryEnabled = isIdentityConfigured();
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "บัญชีภายในเว็บไซต์",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      authorize: async (credentials) =>
        isAuthConfigured() ? authenticateLocal(credentials) : null,
    }),
    ...(directoryEnabled
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
            profile(profile) {
              if (!profile.tid || !profile.oid)
                throw new Error("Missing tenant or object identity");
              return {
                id: `${profile.tid}:${profile.oid}`.toLowerCase(),
                name: profile.name ?? "ATTG employee",
                email: profile.email ?? profile.preferred_username,
                image: null,
              };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials")
        return isAuthConfigured() && Boolean(user.id);
      if (
        !directoryEnabled ||
        account?.provider !== "microsoft-entra-id" ||
        !account.providerAccountId ||
        !user.email
      )
        return false;
      const subject = account.providerAccountId.toLowerCase();
      const email = user.email.toLowerCase();
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(5847731)::text`;
        const existing = await tx.user.findUnique({ where: { subject } });
        const emailOwner = await tx.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        // Never link a local password account by matching email alone.
        if (emailOwner && emailOwner.id !== existing?.id) return false;
        if (existing) {
          if (!existing.enabled || existing.source !== "DIRECTORY")
            return false;
          await tx.user.update({
            where: { id: existing.id },
            data: { name: user.name ?? existing.name, email },
          });
          return true;
        }
        const firstAdmin =
          subject === process.env.BOOTSTRAP_ADMIN_SUBJECT?.toLowerCase() &&
          !(await tx.user.findFirst({
            where: { role: "ADMIN", enabled: true },
          }));
        await tx.user.create({
          data: {
            subject,
            email,
            name: user.name ?? email,
            source: "DIRECTORY",
            role: firstAdmin ? "ADMIN" : "READER",
          },
        });
        return true;
      });
    },
    async jwt({ token, account, user }) {
      if (account) {
        if (account.provider === "credentials") {
          token.localUserId = user.id;
          delete token.directorySubject;
        } else {
          token.directorySubject = account.providerAccountId.toLowerCase();
          delete token.localUserId;
        }
        const current =
          account.provider === "credentials"
            ? await prisma.user.findUnique({ where: { id: user.id } })
            : await prisma.user.findUnique({
                where: { subject: String(token.directorySubject) },
              });
        token.userVersion = current?.sessionVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = "";
        const current =
          typeof token.localUserId === "string"
            ? await prisma.user.findFirst({
                where: { id: token.localUserId, source: "LOCAL" },
              })
            : typeof token.directorySubject === "string"
              ? await prisma.user.findFirst({
                  where: {
                    subject: token.directorySubject,
                    source: "DIRECTORY",
                  },
                })
              : null;
        if (
          current?.enabled &&
          current.sessionVersion === (token.userVersion ?? 0)
        )
          session.user.id = current.id;
      }
      return session;
    },
  },
});
