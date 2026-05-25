import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, CreditCard, Sparkles, TrendingUp, Mail } from "lucide-react"

export const dynamic = 'force-static'

function ThemeShowcase({ name, themeClass, desc }: { name: string, themeClass: string, desc: string }) {
  return (
    <div className="space-y-4">
      <div className="container px-4 md:px-6">
        <h2 className="text-2xl font-bold">{name}</h2>
        <p className="text-muted-foreground">{desc}</p>
      </div>

      <div className="mx-4 md:mx-10 rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div className={`w-full p-8 md:p-12 lg:p-16 ${themeClass} bg-background text-foreground transition-colors duration-300`}>
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Mockup Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  {name}
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                  Financial <span className="text-primary">Intelligence</span>
                </h3>
                <p className="text-lg text-muted-foreground max-w-md">
                  A preview of how this color profile affects typography, buttons, and cards.
                </p>
              </div>
              <div className="hidden md:flex gap-3">
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">Log In</Button>
                <Button>Get Started</Button>
              </div>
            </div>

            {/* Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="col-span-1 md:col-span-2 rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold">Quick Actions</h4>
                  <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">New</span>
                </div>
                <div className="flex gap-4 mb-8">
                  <Input placeholder="Ask Aria anything..." className="rounded-xl bg-background border-border" />
                  <Button className="rounded-xl px-6">Send</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Create Invoice", "Log Expense", "View Runway"].map((action) => (
                    <div key={action} className="px-4 py-2 rounded-xl border bg-background text-sm font-medium hover:border-primary/50 cursor-pointer transition-colors">
                      {action}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2 */}
              <div className="col-span-1 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cash Balance</h4>
                <p className="text-4xl font-black mb-2">$142,500</p>
                <p className="text-sm flex items-center gap-1.5 text-primary">
                  <TrendingUp className="h-4 w-4" />
                  +12.4% this month
                </p>

                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Stripe Connected</span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function ColorsDemoPage() {
  return (
    <div className="flex flex-col w-full pb-20 space-y-20">
      <div className="container px-4 md:px-6 py-12 border-b">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Theme Concepts</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          A showcase of distinct color profiles designed to move Ryzha away from a generic SaaS look and towards a premium, modern, AI-first financial platform.
        </p>
      </div>

      <ThemeShowcase 
        name="Forge" 
        themeClass="theme-forge" 
        desc="Premium, warm, trustworthy. Ties into the name 'Ryzha' (copper/red). Stands out from generic blue SaaS."
      />

      <ThemeShowcase 
        name="Vertex" 
        themeClass="theme-vertex" 
        desc="Ultra-modern fintech vibe. Highly technical, clean, and energetic. Similar to fast-moving disruptors."
      />

      <ThemeShowcase 
        name="Quantum" 
        themeClass="theme-quantum" 
        desc="Futuristic, sophisticated, intelligent. Deep slate backgrounds make the AI-focused vivid violet pop."
      />

      <ThemeShowcase 
        name="Void" 
        themeClass="theme-void" 
        desc="Stark, confident, high-end editorial. Uses almost no color except for the electric crimson primary actions."
      />

      {/* New Light Themes */}
      <div className="container px-4 md:px-6 pt-12 border-t">
        <h2 className="text-2xl font-extrabold tracking-tight mb-2">Light Theme Concepts</h2>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Alternative softer, brighter palettes that still maintain a distinct identity.
        </p>
      </div>

      <ThemeShowcase 
        name="Oasis" 
        themeClass="theme-oasis" 
        desc="Soft, organic, calming. Warm off-white backgrounds with a muted sage green. Great for a stress-free financial experience."
      />

      <ThemeShowcase 
        name="Azure" 
        themeClass="theme-azure" 
        desc="Clean, crisp, high-tech. Icy white backgrounds with a vibrant electric blue primary. Feels very fast and modern."
      />

      <ThemeShowcase 
        name="Dune" 
        themeClass="theme-dune" 
        desc="Warm, earthy, distinct. Connects to 'Ryzha' (copper/red) but in a softer daytime execution."
      />

      <ThemeShowcase 
        name="Amethyst" 
        themeClass="theme-amethyst" 
        desc="Elegant, high-end SaaS. Pearl white background with a rich violet primary color."
      />

      <ThemeShowcase 
        name="Blush" 
        themeClass="theme-blush" 
        desc="Vibrant, energetic, and lovely. Soft rose background with a bold magenta pink primary."
      />
    </div>
  )
}
