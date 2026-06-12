import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const architecture = await prisma.financialArchitecture.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  return NextResponse.json(architecture)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json()

  const {
    businessModel,
    billingModel,
    revenueRecognitionPolicy,
    defaultTermMonths,
    departments,
    metricsDefinitions,
    entities,
  } = body

  const revenueRecognition = {
    defaultPolicy: revenueRecognitionPolicy ?? "ratable",
    defaultTermMonths: defaultTermMonths ?? 12,
    standard: body.accountingStandard ?? "ASC606",
  }

  const departmentStructure = {
    departments: departments ?? [],
  }

  const metricsDefinitionsObj = {
    arrFormula: metricsDefinitions?.arrFormula ?? "MRR * 12",
    churnDefinition: metricsDefinitions?.churnDefinition ?? "cancelled subscriptions / total subscriptions",
    ltvFormula: metricsDefinitions?.ltvFormula ?? "ARPA / churn_rate",
    cacDefinition: metricsDefinitions?.cacDefinition ?? "total S&M spend / new customers acquired",
    ...metricsDefinitions,
  }

  const dataFlowMap = {
    revenue: body.revenueSource ?? "stripe",
    payroll: body.payrollSource ?? null,
    expenses: body.expenseSource ?? null,
    accountingSystem: body.accountingSystem ?? "quickbooks",
  }

  const entitiesData = entities ?? [{ name: "Primary Entity", currency: "USD" }]

  const architecture = await prisma.financialArchitecture.upsert({
    where: { organizationId },
    create: {
      organizationId,
      businessModel: businessModel ?? "saas",
      billingModel: billingModel ?? "monthly",
      revenueRecognition,
      departmentStructure,
      metricsDefinitions: metricsDefinitionsObj,
      dataFlowMap,
      entities: entitiesData,
      lastReviewedAt: new Date(),
    },
    update: {
      businessModel: businessModel ?? "saas",
      billingModel: billingModel ?? "monthly",
      revenueRecognition,
      departmentStructure,
      metricsDefinitions: metricsDefinitionsObj,
      dataFlowMap,
      entities: entitiesData,
      lastReviewedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, architecture })
}
