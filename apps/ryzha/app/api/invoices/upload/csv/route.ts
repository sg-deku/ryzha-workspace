import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseExpenseCSV } from "@/lib/parsers/csv-parser"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const mapping = formData.get("mapping") as string
    
    if (!file || !mapping) {
      return NextResponse.json({ error: "Missing file or mapping" }, { status: 400 })
    }

    const columnMapping = JSON.parse(mapping)
    const text = await file.text()
    // Re-use parseExpenseCSV as it's just a generic CSV-to-object mapper
    const parsed = parseExpenseCSV(text, columnMapping)

    let count = 0
    for (const row of parsed) {
      if (!row.invoiceNumber || !row.clientName || !row.total) continue;
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: row.invoiceNumber,
          clientName: row.clientName,
          clientEmail: row.clientEmail || "",
          dueDate: row.dueDate ? new Date(row.dueDate) : new Date(Date.now() + 30*24*60*60*1000),
          subtotal: parseFloat(row.total),
          totalTax: 0,
          total: parseFloat(row.total),
          status: "DRAFT",
          organizationId: session.user.organizationId
        }
      })
      
      count++
    }

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
