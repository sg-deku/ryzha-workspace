import { prisma } from "@ryzha/database"

async function main() {
  console.log("Deleting all data...")
  // Using sequential deletes to respect foreign key constraints
  await prisma.webhookLog.deleteMany()
  await prisma.webhook.deleteMany()
  await prisma.reportSchedule.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.aIUsageLog.deleteMany()
  await prisma.chatMessage.deleteMany()
  await prisma.usageMetrics.deleteMany()
  await prisma.auditLog.deleteMany()
  
  await prisma.financialSettings.deleteMany()
  await prisma.p2PSettings.deleteMany()
  await prisma.o2CSettings.deleteMany()
  await prisma.taxRule.deleteMany()
  await prisma.chartOfAccounts.deleteMany()
  await prisma.dashboardLayout.deleteMany()

  await prisma.expenseAnomaly.deleteMany()
  await prisma.expense.deleteMany()
  
  await prisma.invoiceLineItem.deleteMany()
  await prisma.invoice.deleteMany()
  
  await prisma.vendorInvoiceLine.deleteMany()
  await prisma.vendorInvoice.deleteMany()
  
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  
  await prisma.salesOrderLine.deleteMany()
  await prisma.salesOrder.deleteMany()
  
  await prisma.transaction.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.generalLedgerEntry.deleteMany()
  await prisma.financialSnapshot.deleteMany()
  
  await prisma.customer.deleteMany()
  await prisma.vendor.deleteMany()

  await prisma.userOrganization.deleteMany()
  
  await prisma.rolePermission.deleteMany()
  await prisma.role.deleteMany()

  // Ensure we don't delete super admin users if they exist, or just delete all non-super admins
  await prisma.user.deleteMany({
    where: {
      isSuperAdmin: false
    }
  })

  await prisma.organization.deleteMany()
  
  console.log("All organizations and users (except super admins) deleted.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
