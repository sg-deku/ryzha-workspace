import Link from "next/link"
import { ArrowLeft, Zap, Sparkles, Target, Heart } from "lucide-react"

export const dynamic = 'force-static'

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center w-full">

      {/* ─── Dark banner hero ─── */}
      <section className="w-full bg-foreground text-background">
        <div className="container px-4 md:px-6 py-14 lg:py-20">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-background/50 hover:text-background/80 transition-colors mb-10">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Ryzha
          </Link>
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-background/40">About</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.06]">
              Built by founders,<br />for founders.
            </h1>
            <p className="text-lg text-background/60 max-w-[480px] leading-relaxed">
              Ryzha was born from a simple frustration — founders spending too many hours on accounting instead of building their companies.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="w-full py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                color: "text-primary bg-primary/10",
                title: "Our Mission",
                desc: "Give every startup founder the financial intelligence that was previously only available to well-funded companies with dedicated CFOs and accounting teams.",
              },
              {
                icon: Zap,
                color: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
                title: "Our Approach",
                desc: "Replace manual processes with AI agents that work 24/7. Not another dashboard to stare at — an autonomous system that handles reconciliation, reporting, and forecasting.",
              },
              {
                icon: Heart,
                color: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
                title: "Our Promise",
                desc: "Ryzha will always be honest about what it does and doesn't do. No black-box magic — every action is transparent, traceable, and auditable.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex flex-col gap-4 p-6 rounded-2xl bg-background border hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Founders ─── */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              The founders
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              The people behind the product
            </h2>
            <p className="text-muted-foreground text-lg">
              A two-person team with a clear belief: financial intelligence should be accessible to every founder, not just the ones who can afford a CFO.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                name: "Karina Rocha",
                role: "CEO & Founder",
                initials: "KR",
                gradient: "from-violet-600 to-primary",
                bio: "The visionary behind Ryzha. Karina combines deep industry knowledge with a clear vision for the future of financial intelligence for startups. She drives the product strategy, customer insight, and the core belief that founders deserve better financial tooling.",
              },
              {
                name: "Sushmit Ghosh",
                role: "CTO & Lead Engineer",
                initials: "SG",
                gradient: "from-primary to-blue-600",
                bio: "The technical powerhouse making Ryzha a reality. Sushmit architects and builds the AI-driven systems, workflow orchestrators, and integrations that give Ryzha its capabilities. He turns Karina's vision into production-grade software.",
              },
            ].map(({ name, role, initials, gradient, bio }) => (
              <div key={name} className="flex flex-col gap-6 p-8 rounded-2xl border bg-background hover:border-primary/30 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white text-xl font-black">{initials}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{name}</h3>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full mt-1">
                      {role}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact nudge ─── */}
      <section className="w-full py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">Want to talk to us directly?</h2>
            <p className="text-muted-foreground">
              We read every message. If you have questions, feedback, or just want to say hello — reach out.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
