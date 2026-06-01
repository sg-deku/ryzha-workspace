import { prisma } from "@/lib/prisma"
import { resolveConfig, type ExecutionContext } from "./pill-resolver"
import { executeRyzhaAction } from "./handlers/ryzha-handler"
import { executeHttpAction } from "./handlers/http-handler"
import { executeSlackAction } from "./handlers/slack-handler"
import { executeCondition, executeTransform } from "./handlers/logic-handler"

export async function runWorkflow(workflowId: string, triggerPayload: Record<string, unknown>, triggeredBy = "MANUAL_TEST") {
  const workflow = await prisma.wsWorkflow.findUnique({
    where: { id: workflowId },
    include: {
      nodes: {
        include: {
          trigger: { include: { connector: true } },
          action: { include: { connector: true } },
          connection: true,
        },
      },
      edges: true,
    },
  })
  if (!workflow) throw new Error("Workflow not found")

  const execution = await prisma.wsWorkflowExecution.create({
    data: {
      workflowId,
      status: "RUNNING",
      triggeredBy,
      triggerPayload: triggerPayload as any,
    },
  })

  const context: ExecutionContext = { trigger: triggerPayload }
  const nodeMap = Object.fromEntries(workflow.nodes.map((n) => [n.id, n]))
  const edgeMap: Record<string, string[]> = {}
  for (const edge of workflow.edges) {
    if (!edgeMap[edge.sourceNodeId]) edgeMap[edge.sourceNodeId] = []
    edgeMap[edge.sourceNodeId].push(edge.targetNodeId)
  }

  const triggerNode = workflow.nodes.find((n) => n.nodeType === "TRIGGER")
  if (!triggerNode) {
    await prisma.wsWorkflowExecution.update({ where: { id: execution.id }, data: { status: "FAILED", errorMessage: "No trigger node found", finishedAt: new Date() } })
    return execution.id
  }

  const queue: string[] = edgeMap[triggerNode.id] ?? []
  const visited = new Set<string>()
  const startTime = Date.now()

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    const node = nodeMap[nodeId]
    if (!node) continue

    const nodeStart = Date.now()
    const logEntry = await prisma.wsWorkflowNodeLog.create({
      data: { executionId: execution.id, nodeId, status: "RUNNING", input: resolveConfig(node.config as Record<string, unknown>, context) as any },
    })

    try {
      const resolved = resolveConfig(node.config as Record<string, unknown>, context)
      let output: Record<string, unknown> = {}

      const connectorSlug = node.trigger?.connector?.slug ?? node.action?.connector?.slug ?? ""
      const actionSlug = node.trigger?.slug ?? node.action?.slug ?? ""

      const connConfig: Record<string, unknown> = node.connection
        ? (() => { try { return JSON.parse(node.connection.encryptedConfig) } catch { return {} } })()
        : {}

      if (connectorSlug === "ryzha") {
        output = await executeRyzhaAction({ actionSlug, config: resolved, organizationId: workflow.organizationId })
      } else if (connectorSlug === "http") {
        output = await executeHttpAction({ actionSlug, config: resolved })
      } else if (connectorSlug === "slack") {
        output = await executeSlackAction({ actionSlug, config: resolved, connectionConfig: connConfig })
      } else if (connectorSlug === "condition") {
        output = executeCondition({ expression: resolved.expression as string, context })
        const isTrue = Boolean(output.result)
        const trueEdges = workflow.edges.filter((e) => e.sourceNodeId === nodeId && e.sourceHandle === "true").map((e) => e.targetNodeId)
        const falseEdges = workflow.edges.filter((e) => e.sourceNodeId === nodeId && e.sourceHandle === "false").map((e) => e.targetNodeId)
        const nextEdges = isTrue ? trueEdges : falseEdges
        queue.push(...nextEdges)
        await prisma.wsWorkflowNodeLog.update({ where: { id: logEntry.id }, data: { status: "COMPLETED", output: output as any, durationMs: Date.now() - nodeStart } })
        context[nodeId] = output
        continue
      } else if (connectorSlug === "transform") {
        output = executeTransform(resolved.expression as string, context as any)
      } else if (connectorSlug === "delay") {
        const ms = Number(resolved.duration ?? 0) * (resolved.unit === "minutes" ? 60000 : resolved.unit === "hours" ? 3600000 : 1000)
        await new Promise((r) => setTimeout(r, Math.min(ms, 30000)))
        output = { resumedAt: new Date().toISOString(), waitedMs: ms }
      } else if (connectorSlug === "stop") {
        await prisma.wsWorkflowNodeLog.update({ where: { id: logEntry.id }, data: { status: "COMPLETED", output: { stoppedAt: new Date().toISOString(), message: resolved.message ?? "" } as any, durationMs: Date.now() - nodeStart } })
        break
      }

      context[nodeId] = output
      await prisma.wsWorkflowNodeLog.update({ where: { id: logEntry.id }, data: { status: "COMPLETED", output: output as any, durationMs: Date.now() - nodeStart } })
      queue.push(...(edgeMap[nodeId] ?? []))
    } catch (err: any) {
      await prisma.wsWorkflowNodeLog.update({ where: { id: logEntry.id }, data: { status: "FAILED", error: err.message, durationMs: Date.now() - nodeStart } })
      await prisma.wsWorkflowExecution.update({ where: { id: execution.id }, data: { status: "FAILED", errorMessage: err.message, finishedAt: new Date(), durationMs: Date.now() - startTime } })
      return execution.id
    }
  }

  await prisma.wsWorkflowExecution.update({ where: { id: execution.id }, data: { status: "COMPLETED", finishedAt: new Date(), durationMs: Date.now() - startTime } })
  return execution.id
}
