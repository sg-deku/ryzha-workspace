import { PrismaClient } from "@ryzha/database"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ryzha.com"
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123"
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin"

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, isSuperAdmin: true },
    create: {
      email,
      password: hashed,
      name,
      isSuperAdmin: true,
    },
  })

  console.log(`Super admin upserted: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
