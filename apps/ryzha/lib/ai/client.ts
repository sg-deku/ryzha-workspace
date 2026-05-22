import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

function detectProvider(): string {
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.GROQ_API_KEY) return "groq"
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  return "openai"
}

function envKeyForProvider(provider: string): string | undefined {
  switch (provider) {
    case "groq": return process.env.GROQ_API_KEY
    case "anthropic": return process.env.ANTHROPIC_API_KEY
    default: return process.env.OPENAI_API_KEY
  }
}

function defaultModel(provider: string): string {
  switch (provider) {
    case "groq": return "llama-3.3-70b-versatile"
    case "anthropic": return "claude-3-haiku-20240307"
    default: return "gpt-4o-mini"
  }
}

interface AIClientConfig {
  client: OpenAI
  model: string
  provider: string
}

export async function getAIClientConfig(organizationId: string): Promise<AIClientConfig> {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { aiProvider: true, aiModel: true, aiApiKey: true },
  })

  const provider = settings?.aiProvider?.trim() || detectProvider()
  const model = settings?.aiModel?.trim() || defaultModel(provider)
  const dbKey = settings?.aiApiKey?.trim() || undefined
  const apiKey = dbKey || envKeyForProvider(provider)

  if (!apiKey && provider !== "ollama") {
    throw new Error(
      `No API key configured for ${provider}. ` +
      `Go to Settings → Financial Engine → AI Config and enter your API key, ` +
      `or set the ${provider.toUpperCase()}_API_KEY environment variable.`
    )
  }

  switch (provider) {
    case "groq":
      return {
        provider,
        model,
        client: new OpenAI({
          apiKey: apiKey!,
          baseURL: "https://api.groq.com/openai/v1",
        }),
      }
    case "anthropic":
      return {
        provider,
        model,
        client: new OpenAI({
          apiKey: apiKey!,
          baseURL: "https://api.anthropic.com/v1",
          defaultHeaders: { "anthropic-version": "2023-06-01" },
        }),
      }
    default:
      return {
        provider,
        model,
        client: new OpenAI({ apiKey: apiKey! }),
      }
  }
}

export async function invokeAI(
  organizationId: string,
  prompt: string,
  options: { temperature?: number; json?: boolean; feature?: string } = {}
): Promise<string> {
  const { client, model, provider } = await getAIClientConfig(organizationId)

  const supportsJsonMode = provider === "openai"
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: options.temperature ?? 0.2,
    ...(options.json && supportsJsonMode ? { response_format: { type: "json_object" } } : {}),
  })

  const usage = completion.usage
  if (usage && organizationId) {
    prisma.aIUsageLog.create({
      data: {
        organizationId,
        feature: options.feature ?? "unknown",
        model,
        provider,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    }).catch(() => {})
  }

  return completion.choices[0]?.message?.content || ""
}
