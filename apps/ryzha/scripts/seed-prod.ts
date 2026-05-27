
import { PrismaClient } from "@ryzha/database"
import { DEFAULT_CHART_OF_ACCOUNTS } from "../lib/default-chart-of-accounts"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  const orgs = await prisma.organization.findMany()
  console.log(`Found ${orgs.length} organizations.`)

  for (const org of orgs) {
    console.log(`Seeding for organization: ${org.name} (${org.id})`)

    // 1. Seed Chart of Accounts
    console.log("  Seeding Chart of Accounts...")
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      await prisma.chartOfAccounts.upsert({
        where: {
          organizationId_accountName: {
            organizationId: org.id,
            accountName: account.accountName,
          },
        },
        update: {},
        create: {
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          categoryMatch: account.categoryMatch,
          organizationId: org.id,
        },
      })
    }

    // 2. Seed Default Customer
    console.log("  Seeding Default Customer...")
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: "billing@globalprime.com", organizationId: org.id },
    })
    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          name: "Global Prime Corp",
          email: "billing@globalprime.com",
          status: "ACTIVE",
          organizationId: org.id,
          paymentTerms: "NET30",
          address: {
            street: "100 Innovation Way",
            city: "San Francisco",
            country: "USA",
            postalCode: "94105",
          },
        },
      })
    }

    // 3. Seed Default Vendor
    console.log("  Seeding Default Vendor...")
    await prisma.vendor.create({
      data: {
        name: "Enterprise Solutions LLC",
        email: "ap@enterprisesolutions.com",
        status: "ACTIVE",
        organizationId: org.id,
        paymentTerms: "NET30",
        address: {
          street: "500 Enterprise Dr",
          city: "New York",
          country: "USA",
          postalCode: "10001"
        }
      }
    }).catch(() => {
        console.log("  Default vendor might already exist, skipping...")
    })
  }

  console.log("Seed completed successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
