import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { addDays } from "date-fns"

export interface CreateApprovalRequestParams {
  organizationId: string
  entityType: "PurchaseOrder" | "Expense"
  entityId: string
  approverId: string
  approverName: string
  approverEmail?: string
  requestedBy: string
  amount?: number
  description?: string
}

export async function createApprovalRequest(params: CreateApprovalRequestParams) {
  const settings = await prisma.p2PSettings.findUnique({
    where: { organizationId: params.organizationId },
  })
  const deadlineDays = settings?.approvalDeadlineDays ?? 3
  const dueDate = addDays(new Date(), deadlineDays)

  const request = await prisma.approvalRequest.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      entityType: params.entityType,
      entityId: params.entityId,
      approverId: params.approverId,
      approverName: params.approverName,
      approverEmail: params.approverEmail,
      requestedBy: params.requestedBy,
      dueDate,
      amount: params.amount,
      description: params.description,
      status: "PENDING",
    },
  })

  await createNotification({
    organizationId: params.organizationId,
    type: "WARNING",
    title: "Approval Required",
    message: `${params.entityType === "PurchaseOrder" ? "Purchase Order" : "Expense"} requires your approval${params.amount ? ` — $${params.amount.toLocaleString()}` : ""}. Due: ${dueDate.toLocaleDateString()}.`,
    link: `/approvals`,
  })

  return request
}

export async function approveRequest(
  organizationId: string,
  requestId: string,
  userId: string,
  userName: string,
  note?: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
  if (!request || request.organizationId !== organizationId) throw new Error("Approval request not found")
  if (request.status !== "PENDING" && request.status !== "ESCALATED") {
    throw new Error(`Cannot approve a request with status ${request.status}`)
  }

  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      decidedAt: new Date(),
      decisionNote: note,
    },
  })

  if (request.entityType === "PurchaseOrder") {
    await prisma.purchaseOrder.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { status: "APPROVED", approvedBy: userName, approvedAt: new Date() },
    })
  } else if (request.entityType === "Expense") {
    await prisma.expense.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { status: "APPROVED", approvedBy: userName, approvedAt: new Date() },
    })
  }

  await createNotification({
    organizationId,
    type: "SUCCESS",
    title: "Request Approved",
    message: `${request.entityType === "PurchaseOrder" ? "Purchase Order" : "Expense"} approved by ${userName}.${note ? ` Note: ${note}` : ""}`,
    link: request.entityType === "PurchaseOrder" ? `/purchases` : `/expenses`,
  })

  return updated
}

export async function rejectRequest(
  organizationId: string,
  requestId: string,
  userId: string,
  userName: string,
  note?: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
  if (!request || request.organizationId !== organizationId) throw new Error("Approval request not found")
  if (request.status !== "PENDING" && request.status !== "ESCALATED") {
    throw new Error(`Cannot reject a request with status ${request.status}`)
  }

  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      decidedAt: new Date(),
      decisionNote: note,
    },
  })

  if (request.entityType === "PurchaseOrder") {
    await prisma.purchaseOrder.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { status: "DRAFT" },
    })
  } else if (request.entityType === "Expense") {
    await prisma.expense.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { status: "PENDING" },
    })
  }

  await createNotification({
    organizationId,
    type: "ERROR",
    title: "Request Rejected",
    message: `${request.entityType === "PurchaseOrder" ? "Purchase Order" : "Expense"} rejected by ${userName}.${note ? ` Reason: ${note}` : ""}`,
    link: request.entityType === "PurchaseOrder" ? `/purchases` : `/expenses`,
  })

  return updated
}

export async function delegateRequest(
  organizationId: string,
  requestId: string,
  delegateToId: string,
  delegateToName: string,
  note?: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
  if (!request || request.organizationId !== organizationId) throw new Error("Approval request not found")
  if (request.status !== "PENDING") throw new Error(`Cannot delegate a request with status ${request.status}`)

  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: "DELEGATED",
      delegatedTo: delegateToId,
      delegatedAt: new Date(),
      decisionNote: note,
    },
  })

  const newRequest = await prisma.approvalRequest.create({
    data: {
      id: crypto.randomUUID(),
      organizationId,
      entityType: request.entityType,
      entityId: request.entityId,
      approverId: delegateToId,
      approverName: delegateToName,
      requestedBy: request.requestedBy,
      dueDate: request.dueDate,
      amount: request.amount,
      description: request.description,
      status: "PENDING",
    },
  })

  if (request.entityType === "PurchaseOrder") {
    await prisma.purchaseOrder.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { approvalRequestId: newRequest.id },
    })
  } else if (request.entityType === "Expense") {
    await prisma.expense.updateMany({
      where: { approvalRequestId: requestId, organizationId },
      data: { approvalRequestId: newRequest.id },
    })
  }

  await createNotification({
    organizationId,
    type: "INFO",
    title: "Approval Delegated",
    message: `Approval request delegated to ${delegateToName}.`,
    link: `/approvals`,
  })

  return { delegated: updated, newRequest }
}

export async function escalateOverdueRequests(organizationId: string) {
  const settings = await prisma.p2PSettings.findUnique({
    where: { organizationId },
  })

  const overdueRequests = await prisma.approvalRequest.findMany({
    where: {
      organizationId,
      status: "PENDING",
      dueDate: { lt: new Date() },
    },
  })

  const results = []
  for (const req of overdueRequests) {
    const updated = await prisma.approvalRequest.update({
      where: { id: req.id },
      data: { status: "ESCALATED", escalatedAt: new Date() },
    })

    await createNotification({
      organizationId,
      type: "WARNING",
      title: "Approval Overdue — Escalated",
      message: `An approval request for ${req.entityType} is overdue and has been escalated.`,
      link: `/approvals`,
    })

    if (settings?.escalationApproverId) {
      await prisma.approvalRequest.create({
        data: {
          id: crypto.randomUUID(),
          organizationId,
          entityType: req.entityType,
          entityId: req.entityId,
          approverId: settings.escalationApproverId,
          approverName: "Escalation Approver",
          requestedBy: req.requestedBy,
          dueDate: addDays(new Date(), 1),
          amount: req.amount,
          description: req.description,
          status: "PENDING",
        },
      })
    }

    results.push(updated)
  }

  return results
}

export async function getPendingCount(organizationId: string) {
  return prisma.approvalRequest.count({
    where: { organizationId, status: { in: ["PENDING", "ESCALATED"] } },
  })
}
