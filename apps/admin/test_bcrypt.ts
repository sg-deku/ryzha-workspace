import { PrismaClient } from "@ryzha/database";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@ryzha.com' } });
  if (user) {
    const isValid = await bcrypt.compare('changeme123', user.password!);
    console.log("Is Valid:", isValid);
  }
}
main().finally(() => prisma.$disconnect());
