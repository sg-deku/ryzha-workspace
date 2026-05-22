import { PrismaClient } from '@ryzha/database'
import bcrypt from "bcryptjs"

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
    update: {},
    create: {
      name: 'Ryzha HQ',
      slug: 'ryzha-hq',
      plan: 'FREE',
    },
  })

  // 3. Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { id: 'admin-role-id' }, // Fixed ID for seeding consistency
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
