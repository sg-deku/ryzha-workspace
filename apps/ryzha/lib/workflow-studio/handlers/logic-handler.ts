interface ConditionInput {
  expression: string
  context: Record<string, unknown>
}

export function executeCondition({ expression, context }: ConditionInput): Record<string, unknown> {
  try {
    const flatContext = flattenContext(context)
    const fn = new Function(...Object.keys(flatContext), `return !!(${expression})`)
    const result = fn(...Object.values(flatContext))
    return { result: Boolean(result), expression }
  } catch (err: any) {
    return { result: false, expression, error: err.message }
  }
}

export function executeTransform(expression: string, data: Record<string, unknown>): Record<string, unknown> {
  try {
    const fn = new Function("data", `
      const { ${Object.keys(data).join(", ")} } = data;
      return (${expression});
    `)
    const result = fn(data)
    return { result }
  } catch (err: any) {
    throw new Error(`Transform error: ${err.message}`)
  }
}

function flattenContext(ctx: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(ctx)) {
    const key = prefix ? `${prefix}_${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(flat, flattenContext(v as Record<string, unknown>, key))
    } else {
      flat[key] = v
    }
  }
  return flat
}
