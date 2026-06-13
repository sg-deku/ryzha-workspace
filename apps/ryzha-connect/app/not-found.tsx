import Link from "next/link"

export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-5xl font-semibold text-foreground">404</p>
        <p className="text-muted-foreground">This page could not be found.</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    </div>
  )
}
