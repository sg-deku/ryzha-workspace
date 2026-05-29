import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendSignupThankYouEmail } from "@/lib/email"
import { seedDefaultChartOfAccounts } from "@/lib/default-chart-of-accounts"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, name, organizationName } = await req.json()

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7),
          onboardingCompleted: false,
          status: "PENDING",
        }
      })

      await tx.financialSettings.create({
        data: {
          organizationId: organization.id,
          deferredRevenueRules: ["annual", "yearly", "subscription"],
        }
      })

      await seedDefaultChartOfAccounts(organization.id, tx)

      // 2. Ensure default permissions exist (or at least the ones we need)
      // For MVP, we'll just use names. In a real app, you might seed these.
      const permissions = [
        "users:manage",
        "roles:manage",
        "invoices:manage",
        "expenses:manage",
        "reports:view",
        "org:manage",
        "financial:manage",
        "agent:manage"
      ]

      for (const pName of permissions) {
        await tx.permission.upsert({
          where: { name: pName },
          update: {},
          create: { name: pName }
        })
      }

      const allPermissions = await tx.permission.findMany({
        where: { name: { in: permissions } }
      })

      const permByName = Object.fromEntries(allPermissions.map(p => [p.name, p]))

      const roleDefinitions = [
        {
          name: "Admin",
          isSystem: true,
          perms: permissions,
        },
        {
          name: "Manager",
          isSystem: true,
          perms: ["invoices:manage", "expenses:manage", "reports:view", "financial:manage", "agent:manage"],
        },
        {
          name: "Accountant",
          isSystem: true,
          perms: ["invoices:manage", "expenses:manage", "reports:view", "financial:manage"],
        },
        {
          name: "Employee",
          isSystem: true,
          perms: ["expenses:manage", "reports:view"],
        },
        {
          name: "Viewer",
          isSystem: true,
          perms: ["reports:view"],
        },
      ]

      let adminRole: { id: string } | null = null
      for (const def of roleDefinitions) {
        const role = await tx.role.create({
          data: {
            name: def.name,
            isSystem: def.isSystem,
            organizationId: organization.id,
            permissions: {
              create: def.perms
                .filter(p => permByName[p])
                .map(p => ({ permissionId: permByName[p].id }))
            }
          }
        })
        if (def.name === "Admin") adminRole = role
      }

      if (!adminRole) throw new Error("Admin role creation failed")

      // 4. Create User
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          status: "ACTIVE",
          organizations: {
            create: {
              organizationId: organization.id,
              roleId: adminRole.id
            }
          }
        }
      })

      return { user, organization }
    })

    sendSignupThankYouEmail(email, name).catch((err) =>
      console.error("[signup] Failed to send thank-you email:", err)
    )

    return NextResponse.json({ message: "User created successfully", userId: result.user.id }, { status: 201 })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
