import { prisma } from "@/lib/prisma"
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOllama } from "@langchain/ollama"

function detectAvailableProvider(): string {
  if (process.env.GROQ_API_KEY) return "groq"
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.ANTHROPIC_API_KEY) return "anthropic"
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) return "gemini"
  return "groq"
}

function defaultModelForProvider(provider: string): string {
  switch (provider) {
    case "groq": return "llama-3.3-70b-versatile"
    case "anthropic": return "claude-3-haiku-20240307"
    case "gemini": return "gemini-1.5-flash"
    default: return "gpt-4o-mini"
  }
}

export async function getLLM(organizationId: string, options: { temperature?: number } = {}) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { aiProvider: true, aiModel: true, aiApiKey: true },
  })

  const provider = settings?.aiProvider?.trim() || detectAvailableProvider()
  const model = settings?.aiModel?.trim() || defaultModelForProvider(provider)
  const dbKey = settings?.aiApiKey?.trim() || undefined

  function requireKey(envVar: string, providerName: string): string {
    const key = dbKey || process.env[envVar]
    if (!key) {
      throw new Error(
        `No API key found for ${providerName}. ` +
        `Go to Settings → Financial Engine → AI Config and enter your ${providerName} API key, ` +
        `or set the ${envVar} environment variable.`
      )
    }
    return key
  }

  const temp = options.temperature ?? 0.2

  switch (provider) {
    case "anthropic":
      return new ChatAnthropic({
        modelName: model,
        temperature: temp,
        anthropicApiKey: requireKey("ANTHROPIC_API_KEY", "Anthropic"),
      })
    case "gemini":
      return new ChatGoogleGenerativeAI({
        model: model,
        temperature: temp,
        apiKey: requireKey("GOOGLE_API_KEY", "Google Gemini"),
      })
    case "groq":
      return new ChatOpenAI({
        modelName: model || "llama-3.3-70b-versatile",
        temperature: temp,
        openAIApiKey: requireKey("GROQ_API_KEY", "Groq"),
        configuration: { baseURL: "https://api.groq.com/openai/v1" },
      })
    case "ollama":
      return new ChatOllama({
        baseUrl: "http://localhost:11434",
        model: model || "llama3",
        temperature: temp,
      })
    case "openai":
    default:
      return new ChatOpenAI({
        modelName: model,
        temperature: temp,
        openAIApiKey: requireKey("OPENAI_API_KEY", "OpenAI"),
      })
  }
}

function toBaseMessages(messages: ({ role: string; content: string } | BaseMessage)[]): BaseMessage[] {
  return messages.map((m) => {
    if (m instanceof BaseMessage) return m
    const raw = m as { role: string; content: string }
    if (raw.role === "system") return new SystemMessage(raw.content)
    if (raw.role === "assistant") return new AIMessage(raw.content)
    return new HumanMessage(raw.content)
  })
}

export async function callLLM(
  organizationId: string,
  messages: ({ role: string; content: string } | BaseMessage)[],
  feature: string,
  options: { temperature?: number } = {}
) {
  const llm = await getLLM(organizationId, options)
  const baseMessages = toBaseMessages(messages)
  const response = await llm.invoke(baseMessages)

  const usageMeta = (response as any).response_metadata
  const usage = usageMeta?.usage ?? usageMeta?.tokenUsage

  if (usage) {
    const settings = await prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { aiProvider: true, aiModel: true },
    })
    prisma.aIUsageLog.create({
      data: {
        organizationId,
        feature,
        model: settings?.aiModel ?? "unknown",
        provider: settings?.aiProvider ?? "unknown",
        promptTokens: usage.input_tokens ?? usage.promptTokens ?? 0,
        completionTokens: usage.output_tokens ?? usage.completionTokens ?? 0,
        totalTokens: (usage.input_tokens ?? usage.promptTokens ?? 0) + (usage.output_tokens ?? usage.completionTokens ?? 0),
      },
    }).catch(() => {})
  }

  const content = typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content)

  return { content, text: content }
}
