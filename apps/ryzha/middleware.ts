export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/invoices/:path*", "/expenses/:path*", "/settings/:path*"]
}
