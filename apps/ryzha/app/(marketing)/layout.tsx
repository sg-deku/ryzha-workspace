import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold group">
            <div className="h-10 w-10 bg-primary logo-mask group-hover:opacity-90 transition-opacity" />
            <span className="text-xl">Ryzha</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact Us</Link>
            </nav>
            <ThemeToggle />
            <Link 
              href="/login"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col bg-grid-pattern">
        {children}
      </main>
      <footer className="border-t bg-muted/50 mt-auto py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ryzha. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link href="/api-docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              API Documentation
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
