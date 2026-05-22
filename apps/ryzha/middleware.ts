import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

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
    "/dashboard/:path*",
    "/invoices/:path*",
    "/expenses/:path*",
    "/settings/:path*",
    "/collections/:path*",
    "/contracts/:path*",
    "/customers/:path*",
    "/purchases/:path*",
    "/reports/:path*",
    "/sales-orders/:path*",
    "/transactions/:path*",
    "/vendor-invoices/:path*",
    "/vendors/:path*",
    "/workflow-studio/:path*"
  ]
}