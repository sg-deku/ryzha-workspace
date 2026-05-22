import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-static'

export default function AboutPage() {
  return (
    <div className="container mx-auto py-16 px-4 max-w-5xl">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">About the Creators</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The team behind Ryzha, building the financial brain for modern startups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* Karina Rocha */}
        <Card className="flex flex-col items-center text-center p-6 bg-card hover:shadow-md transition-shadow">
          <CardHeader className="space-y-6 flex flex-col items-center">
            {/* Image Placeholder */}
            <div className="w-48 h-48 rounded-full bg-muted border-4 border-background shadow-sm overflow-hidden flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Image Placeholder</span>
              {/* <img src="/images/karina.jpg" alt="Karina Rocha" className="w-full h-full object-cover" /> */}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Karina Rocha</CardTitle>
              <Badge variant="secondary" className="text-sm font-medium">CEO & Founder</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              The visionary behind Ryzha. As the mastermind and brain child of the platform, Karina combines deep industry knowledge with a clear vision for the future of financial intelligence for startups.
            </p>
          </CardContent>
        </Card>

        {/* Sushmit Ghosh */}
        <Card className="flex flex-col items-center text-center p-6 bg-card hover:shadow-md transition-shadow">
          <CardHeader className="space-y-6 flex flex-col items-center">
            {/* Image Placeholder */}
            <div className="w-48 h-48 rounded-full bg-muted border-4 border-background shadow-sm overflow-hidden flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Image Placeholder</span>
              {/* <img src="/images/sushmit.jpg" alt="Sushmit Ghosh" className="w-full h-full object-cover" /> */}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Sushmit Ghosh</CardTitle>
              <Badge variant="secondary" className="text-sm font-medium">CTO & Lead Engineer</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              The technical powerhouse making Ryzha a reality. Sushmit architects and builds the complex AI-driven systems, workflow orchestrators, and integrations that give Ryzha its capabilities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
