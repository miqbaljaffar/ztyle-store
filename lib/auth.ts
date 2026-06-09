import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { compare } from 'bcrypt';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;
        if (!user.emailVerified) throw new Error("Email belum diverifikasi. Silakan cek email Anda.");

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return user;
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const dbUser = await prisma.user.findUnique({
           where: { email: profile.email },
        });

        if (!dbUser) {
            await prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    image: (profile as any).picture,
                    role: 'CUSTOMER',
                    emailVerified: new Date(),
                },
            });
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.address = session.user.address;
        token.phoneNumber = session.user.phoneNumber;
      }
      
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.address = dbUser.address;
          token.phoneNumber = dbUser.phoneNumber;
        }
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id);
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
        session.user.address = token.address as string | null;
        session.user.phoneNumber = token.phoneNumber as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};