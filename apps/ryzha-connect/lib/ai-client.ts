import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

export type AIProvider = "openai" | "anthropic" | "groq" | "gemini" | "ollama"

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string | null
}

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIResponse {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
  provider: AIProvider
}

const PROVIDER_BASE_URLS: Record<AIProvider, string | null> = {
  openai: null,
  anthropic: null,
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  ollama: "http://localhost:11434/v1",
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
  ollama: "llama3",
}

export async function getAIConfig(organizationId: string): Promise<AIConfig> {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { aiProvider: true, aiModel: true, aiApiKey: true },
  })

  const provider = (settings?.aiProvider ?? "openai") as AIProvider
  const model = settings?.aiModel ?? DEFAULT_MODELS[provider] ?? "gpt-4o-mini"
  const apiKey = settings?.aiApiKey ?? null

  return { provider, model, apiKey }
}

async function callAnthropic(
  config: AIConfig,
  messages: AIMessage[],
  maxTokens: number
): Promise<AIResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("No Anthropic API key configured")

  const client = new Anthropic({ apiKey })

  const systemMsg = messages.find((m) => m.role === "system")?.content
  const userMsgs = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }))

  const response = await client.messages.create({
    model: config.model,
    max_tokens: maxTokens,
    system: systemMsg,
    messages: userMsgs,
  })

  const content = response.content.find((c) => c.type === "text")?.text ?? ""
  const promptTokens = response.usage.input_tokens
  const completionTokens = response.usage.output_tokens

  return {
    content,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    model: config.model,
    provider: "anthropic",
  }
}

async function callOpenAICompatible(
  config: AIConfig,
  messages: AIMessage[],
  maxTokens: number
): Promise<AIResponse> {
  const baseURL = PROVIDER_BASE_URLS[config.provider]

  let apiKey = config.apiKey
  if (!apiKey) {
    const envMap: Record<AIProvider, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      groq: process.env.GROQ_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      ollama: "ollama",
    }
    apiKey = envMap[config.provider] ?? null
  }

  if (!apiKey && config.provider !== "ollama") {
    throw new Error(`No API key configured for provider: ${config.provider}`)
  }

  const client = new OpenAI({
    apiKey: apiKey ?? "ollama",
    ...(baseURL ? { baseURL } : {}),
  })

  const completion = await client.chat.completions.create({
    model: config.model,
    max_tokens: maxTokens,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
  })

  const content = completion.choices[0]?.message?.content ?? ""
  const promptTokens = completion.usage?.prompt_tokens ?? 0
  const completionTokens = completion.usage?.completion_tokens ?? 0

  return {
    content,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    model: completion.model ?? config.model,
    provider: config.provider,
  }
}

export async function callAI(
  organizationId: string,
  messages: AIMessage[],
  options: {
    feature: string
    maxTokens?: number
    configOverride?: Partial<AIConfig>
  }
): Promise<AIResponse> {
  const baseConfig = await getAIConfig(organizationId)
  const config: AIConfig = { ...baseConfig, ...options.configOverride }
  const maxTokens = options.maxTokens ?? 1000

  let response: AIResponse

  if (config.provider === "anthropic") {
    response = await callAnthropic(config, messages, maxTokens)
  } else {
    response = await callOpenAICompatible(config, messages, maxTokens)
  }

  await prisma.aIUsageLog.create({
    data: {
      organizationId,
      feature: options.feature,
      model: response.model,
      provider: response.provider,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      totalTokens: response.totalTokens,
    },
  }).catch(() => {})

  return response
}
