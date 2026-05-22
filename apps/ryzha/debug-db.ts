import { PrismaClient } from '@ryzha/database'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function debug() {
  try {
    console.log("Checking database connection...")
    const userCount = await prisma.user.count()
    console.log("Total users:", userCount)

    const user = await prisma.user.findUnique({
      where: { email: 'admin@ryzha.com' },
      include: { 
        organizations: {
          include: { organization: true }
        }
      }
    })

    if (!user) {
      console.log("User admin@ryzha.com NOT found")
      return
    }

    console.log("User found:", user.email)
    console.log("Has password field:", !!user.password)
    console.log("Organizations count:", user.organizations.length)
    
    if (user.organizations.length > 0) {
      console.log("First Org ID:", user.organizations[0].organizationId)
    }

    const testPass = "password123"
    if (user.password) {
      const match = await bcrypt.compare(testPass, user.password)
      console.log("Password match test (password123):", match)
    }

  } catch (error) {
    console.error("Debug script error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

debug()
