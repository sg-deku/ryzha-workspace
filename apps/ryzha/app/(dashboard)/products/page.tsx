import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Package, Pencil, Archive } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const products = await prisma.product.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  })

  const active = products.filter(p => p.isActive)
  const archived = products.filter(p => !p.isActive)

  const typeBadge = (type: string) =>
    type === "service"
      ? <Badge className="bg-blue-100 text-blue-800 border border-blue-300">Service</Badge>
      : <Badge className="bg-amber-100 text-amber-800 border border-amber-300">Product</Badge>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product & Service Catalog</h2>
          <p className="text-muted-foreground">Reusable items that auto-fill line items on Sales Orders, Invoices, Purchase Orders, and Vendor Invoices.</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for document lines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{active.filter(p => p.type === "service").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{active.filter(p => p.type === "product").length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>Select a product when adding line items to any document. Name, price, tax rate, and GL account code auto-fill.</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Package className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No products yet. Create your first item to start standardising line items across all documents.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/products/new"><Plus className="mr-2 h-4 w-4" />Create Product</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Code</th>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium text-right">Unit Price</th>
                    <th className="pb-3 pr-4 font-medium text-right">Tax Rate</th>
                    <th className="pb-3 pr-4 font-medium">GL Account</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {active.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.code}</td>
                      <td className="py-3 pr-4 font-medium">
                        {p.name}
                        {p.description && <p className="text-xs text-muted-foreground font-normal truncate max-w-[240px]">{p.description}</p>}
                      </td>
                      <td className="py-3 pr-4">{typeBadge(p.type)}</td>
                      <td className="py-3 pr-4 text-right font-mono">
                        ${p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">{p.taxRate > 0 ? `${p.taxRate}%` : "—"}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{p.accountCode || "—"}</td>
                      <td className="py-3">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <Card className="border-dashed opacity-70">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Archive className="h-4 w-4" />
              Archived ({archived.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {archived.map(p => (
                <div key={p.id} className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono text-xs w-20">{p.code}</span>
                  <span className="line-through">{p.name}</span>
                  <Button asChild variant="ghost" size="sm" className="ml-auto text-xs h-6">
                    <Link href={`/products/${p.id}/edit`}>Restore</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
