export type ExecutionContext = Record<string, Record<string, unknown>>

const PILL_REGEX = /\{\{([\w.[\]]+)\}\}/g

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(/[.[\]]+/).filter(Boolean)
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function resolvePills(value: unknown, context: ExecutionContext): unknown {
  if (typeof value === "string") {
    const matches = [...value.matchAll(PILL_REGEX)]
    if (matches.length === 0) return value

    if (matches.length === 1 && matches[0][0] === value.trim()) {
      const [nodeSlug, ...fieldParts] = matches[0][1].split(".")
      const nodeCtx = context[nodeSlug]
      if (!nodeCtx) return value
      return getNestedValue(nodeCtx, fieldParts.join("."))
    }

    return value.replace(PILL_REGEX, (_, path) => {
      const [nodeSlug, ...fieldParts] = path.split(".")
      const nodeCtx = context[nodeSlug]
      if (!nodeCtx) return `{{${path}}}`
      const val = getNestedValue(nodeCtx, fieldParts.join("."))
      return val != null ? String(val) : `{{${path}}}`
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolvePills(item, context))
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = resolvePills(v, context)
    }
    return result
  }

  return value
}

export function resolveConfig(config: Record<string, unknown>, context: ExecutionContext): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    resolved[k] = resolvePills(v, context)
  }
  return resolved
}
