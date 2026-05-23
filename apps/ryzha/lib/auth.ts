import { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId: string
      role: string
      orgStatus: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    organizationId: string
    role: string
    orgStatus: string
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] Missing credentials")
            return null
          }
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { 
              organizations: {
                take: 1,
                include: { 
                  role: true,
                  organization: { select: { status: true } },
                }
              }
            }
          })

          if (!user) {
            // Silently fail for invalid credentials to avoid spamming server logs
            return null
          }

          if (!user.password) {
            return null
          }
          
          const isValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValid) {
            return null
          }

          const userOrg = user.organizations[0]

          if (!userOrg) {
            return null
          }

          if (userOrg.organization?.status === "SUSPENDED") {
            throw new Error("Your account is suspended, contact the admin for more details")
          }
          
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            organizationId: userOrg?.organizationId || "",
            role: userOrg?.role?.name || "MEMBER",
            orgStatus: userOrg?.organization?.status || "ACTIVE",
          }
        } catch (error) {
          console.error("[auth] Exception in authorize:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.organizationId = user.organizationId
        token.role = user.role
        token.orgStatus = user.orgStatus
      }
      
      if (trigger === "update" && session?.organizationId) {
        token.organizationId = session.organizationId
      }

      if (trigger === "update" && session?.orgStatus) {
        token.orgStatus = session.orgStatus
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.organizationId = token.organizationId as string
        session.user.role = token.role as string
        session.user.orgStatus = token.orgStatus as string
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
}
