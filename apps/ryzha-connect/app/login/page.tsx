"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/overview")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ryzha</h1>
          <p className="text-sm text-muted-foreground">Financial architecture for startups</p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="text-xs text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ryzha Connect - Data-Driven Financial Architecture
        </p>
      </div>
    </div>
  )
}
