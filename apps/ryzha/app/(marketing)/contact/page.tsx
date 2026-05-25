"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, CheckCircle2, ArrowLeft, Sparkles, MessageSquare, Clock } from "lucide-react"

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
      } else {
        setSuccess(true)
      }
    } catch {
      setError("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full">

      {/* ─── Hero ─── */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="container relative px-4 md:px-6 pt-8 pb-20 lg:pb-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Ryzha
          </Link>

          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              We read every message
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              Let's talk
              <br />
              <span className="text-primary">about Ryzha</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-[480px] leading-relaxed">
              Have a question, want a demo, or just curious about what Ryzha can do for your startup? Drop us a message.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="w-full py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">

            {/* Left: info */}
            <div className="space-y-6">
              {[
                {
                  icon: Mail,
                  color: "text-primary bg-primary/10",
                  title: "Email us",
                  lines: ["sushmit.ghosh@icloud.com", "karyrocha3979@hotmail.com"],
                },
                {
                  icon: Clock,
                  color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
                  title: "Response time",
                  lines: ["We typically respond", "within 24 hours."],
                },
                {
                  icon: MessageSquare,
                  color: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
                  title: "What to ask",
                  lines: ["Product questions, demos,", "pricing, or anything else."],
                },
              ].map(({ icon: Icon, color, title, lines }) => (
                <div key={title} className="flex gap-4 p-5 rounded-2xl bg-background border">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">{title}</p>
                    {lines.map((l) => (
                      <p key={l} className="text-sm text-muted-foreground">{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border bg-background shadow-sm p-8">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Message sent!</h3>
                      <p className="text-muted-foreground text-sm">
                        Thanks for reaching out. We'll get back to you as soon as possible.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { setSuccess(false); setForm({ firstName: "", lastName: "", email: "", message: "" }) }}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <h2 className="text-xl font-bold mb-1">Send us a message</h2>
                      <p className="text-sm text-muted-foreground">Fill out the form and our team will get back to you shortly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</Label>
                        <Input
                          id="first-name"
                          placeholder="Jane"
                          required
                          className="rounded-xl"
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
                        <Input
                          id="last-name"
                          placeholder="Doe"
                          required
                          className="rounded-xl"
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        required
                        className="rounded-xl"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        className="min-h-[140px] rounded-xl"
                        required
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" size="lg" className="w-full sm:w-auto rounded-xl font-semibold" disabled={loading}>
                      {loading ? "Sending…" : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
