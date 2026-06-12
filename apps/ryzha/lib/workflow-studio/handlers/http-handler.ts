interface HandlerInput {
  actionSlug: string
  config: Record<string, unknown>
}

export async function executeHttpAction({ actionSlug, config }: HandlerInput): Promise<Record<string, unknown>> {
  if (actionSlug !== "request") throw new Error(`Unknown HTTP action: ${actionSlug}`)

  const method = (config.method as string) || "GET"
  const url = config.url as string
  if (!url) throw new Error("HTTP action requires a URL")

  let headers: Record<string, string> = { "Content-Type": "application/json" }
  if (config.headers) {
    try {
      const parsed = typeof config.headers === "string" ? JSON.parse(config.headers) : config.headers
      headers = { ...headers, ...(parsed as Record<string, string>) }
    } catch {
      // ignore invalid headers JSON
    }
  }

  let body: string | undefined
  if (config.body && method !== "GET" && method !== "DELETE") {
    body = typeof config.body === "string" ? config.body : JSON.stringify(config.body)
  }

  const res = await fetch(url, { method, headers, body })
  const responseHeaders: Record<string, string> = {}
  res.headers.forEach((v, k) => { responseHeaders[k] = v })

  let responseBody: unknown
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    responseBody = await res.json()
  } else {
    responseBody = await res.text()
  }

  return {
    status: res.status,
    statusText: res.statusText,
    body: responseBody,
    headers: responseHeaders,
  }
}
