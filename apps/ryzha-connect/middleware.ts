import { withAuth } from "next-auth/middleware"
import { NextRequest } from "next/server"

const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export default function middleware(req: NextRequest, event: any) {
  return (authMiddleware as any)(req, event)
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/connect/:path*",
    "/staging/:path*",
    "/approvals/:path*",
    "/reconcile/:path*",
    "/collections/:path*",
    "/cash-forecast/:path*",
    "/reports/:path*",
    "/workflows/:path*",
    "/settings/:path*",
  ],
}
