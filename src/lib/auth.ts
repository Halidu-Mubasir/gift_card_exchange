import { PrismaAdapter } from '@auth/prisma-adapter'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextAuthOptions, getServerSession as _getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

// Extend user type to include role
type UserWithRole = {
  id: string
  email?: string | null
  name?: string | null
  role?: Role
}

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth sign-ins, ensure we persist the role on the user object
      // so the jwt callback can pick it up
      if (account?.type === 'oauth' && user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser) {
          ;(user as UserWithRole).role = dbUser.role
          ;(user as UserWithRole).id = dbUser.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as UserWithRole).role ?? Role.SELLER
      }
      // Refresh role from DB if missing (e.g. after schema change)
      if (!token.role && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
        token.role = dbUser?.role ?? Role.SELLER
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // After OAuth sign-in, go to seller dashboard by default
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/seller/dashboard`
      }
      return url.startsWith(baseUrl) ? url : `${baseUrl}/seller/dashboard`
    },
  },
}

export function getServerSession() {
  return _getServerSession(authOptions)
}
