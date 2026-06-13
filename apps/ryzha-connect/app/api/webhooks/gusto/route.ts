import { type NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { runPayrollAgent } from "@/lib/agents/payroll-agent"
import { runHeadcountAgent } from "@/lib/agents/headcount-agent"

export const dynamic = "force-dynamic"

function normaliseGustoWebhookEvent(eventType: string, data: any): {
  externalId: string
  eventType: string
  amount: number | null
  currency: string
  rawPayload: any
  normalisedData: any
} | null {
  switch (eventType) {
    case "payroll.created":
    case "payroll.updated":
    case "payroll.processed": {
      const payroll = data.payroll ?? data
      const gross = parseFloat(payroll.totals?.gross_pay ?? "0")
      return {
        externalId: String(payroll.payroll_uuid ?? payroll.id ?? payroll.payroll_id),
        eventType: "PAYROLL_PROCESSED",
        amount: gross,
        currency: "USD",
        rawPayload: data,
        normalisedData: {
          payPeriodStart: payroll.pay_period?.start_date ?? null,
          payPeriodEnd: payroll.pay_period?.end_date ?? null,
          checkDate: payroll.check_date ?? null,
          grossPay: gross,
          netPay: parseFloat(payroll.totals?.net_pay ?? "0"),
          totalTaxes: parseFloat(payroll.totals?.employee_taxes ?? "0") + parseFloat(payroll.totals?.employer_taxes ?? "0"),
          employeeCount: payroll.employee_compensations?.length ?? 0,
          processed: payroll.processed ?? true,
        },
      }
    }
    case "employee.created":
    case "employee.onboarding_completed": {
      const employee = data.employee ?? data
      return {
        externalId: `gusto_emp_${employee.uuid ?? employee.id}`,
        eventType: "EMPLOYEE_ONBOARDED",
        amount: null,
        currency: "USD",
        rawPayload: data,
        normalisedData: {
          firstName: employee.first_name ?? null,
          lastName: employee.last_name ?? null,
          email: employee.email ?? null,
          department: employee.department ?? null,
          startDate: employee.start_date ?? null,
          employmentType: employee.current_employment_status ?? null,
        },
      }
    }
    case "employee.terminated": {
      const employee = data.employee ?? data
      return {
        externalId: `gusto_term_${employee.uuid ?? employee.id}`,
        eventType: "EMPLOYEE_TERMINATED",
        amount: null,
        currency: "USD",
        rawPayload: data,
        normalisedData: {
          firstName: employee.first_name ?? null,
          lastName: employee.last_name ?? null,
          department: employee.department ?? null,
          terminationDate: employee.termination_date ?? null,
        },
      }
    }
    default:
      return null
  }
}

async function verifyGustoSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false
  const expected = createHmac("sha256", secret).update(body).digest("base64")
  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader, "base64"),
      Buffer.from(expected, "base64")
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: orgId, provider: "GUSTO", status: "ACTIVE" },
    select: { scope: true },
  })
  if (!conn) return NextResponse.json({ error: "Gusto not connected" }, { status: 503 })

  const body = await req.text()

  let scopeData: Record<string, string> = {}
  try { scopeData = conn.scope ? JSON.parse(conn.scope) : {} } catch {}

  const webhookSecret = scopeData?.webhookSecret ?? process.env.GUSTO_WEBHOOK_SECRET

  if (webhookSecret) {
    const sig = req.headers.get("x-gusto-signature-v1")
    const valid = await verifyGustoSignature(body, sig, webhookSecret)
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType: string = payload.event_type ?? payload.type ?? ""
  const normalised = normaliseGustoWebhookEvent(eventType, payload.entity_attributes ?? payload.data ?? payload)

  if (!normalised) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    await prisma.financialEvent.upsert({
      where: {
        organizationId_source_externalId: {
          organizationId: orgId,
          source: "gusto",
          externalId: normalised.externalId,
        },
      },
      create: {
        organizationId: orgId,
        source: "gusto",
        externalId: normalised.externalId,
        eventType: normalised.eventType as any,
        status: "INGESTED",
        amount: normalised.amount,
        currency: normalised.currency,
        rawPayload: normalised.rawPayload,
        normalisedData: normalised.normalisedData,
      },
      update: {},
    })

    after(async () => {
      try {
        await runPayrollAgent(orgId)
        await runHeadcountAgent(orgId)
      } catch (err: any) {
        console.error("[gusto webhook] agent pipeline error:", err?.message)
      }
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[gusto webhook] DB error:", err.message)
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
  }
}
