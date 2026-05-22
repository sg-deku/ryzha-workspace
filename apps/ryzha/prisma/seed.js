const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // 1. Seed Permissions
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
    await prisma.permission.upsert({
      where: { name: pName },
      update: {},
      create: { name: pName }
    })
  }

  const allPermissions = await prisma.permission.findMany()

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'ryzha-hq' },
    update: { onboardingCompleted: true },
    create: {
      name: 'Ryzha HQ',
      slug: 'ryzha-hq',
      plan: 'FREE',
      onboardingCompleted: true,
    },
  })

  // 3. Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { id: 'admin-role-id' },
    update: {},
    create: {
      id: 'admin-role-id',
      name: 'Admin',
      isSystem: true,
      organizationId: org.id,
      permissions: {
        create: allPermissions.map(p => ({
          permissionId: p.id
        }))
      }
    }
  })

  // 4. Create Admin User
  const hashedPassword = await bcrypt.hash("password123", 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@ryzha.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      isSuperAdmin: true,
    },
    create: {
      email: 'admin@ryzha.com',
      name: 'Admin User',
      password: hashedPassword,
      status: 'ACTIVE',
      isSuperAdmin: true,
      organizations: {
        create: {
          organizationId: org.id,
          roleId: adminRole.id
        }
      }
    },
  })

  // Ensure org membership exists even on re-deploys (upsert update path skips nested create)
  const existingMembership = await prisma.userOrganization.findFirst({
    where: { userId: user.id, organizationId: org.id }
  })
  if (!existingMembership) {
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, roleId: adminRole.id }
    })
    console.log('Created missing org membership for admin user')
  }

  await prisma.financialSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      deferredRevenueRules: ["annual", "yearly", "subscription"],
    },
  })

  console.log('Seeding completed:', { org: org.name, user: user.email })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
