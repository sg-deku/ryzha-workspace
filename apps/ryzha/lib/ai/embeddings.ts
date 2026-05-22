import { OpenAIEmbeddings } from "@langchain/openai"
import { OllamaEmbeddings } from "@langchain/ollama"
import { prisma } from "@/lib/prisma"

export async function getEmbeddings(organizationId: string) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
  })

  const provider = settings?.embeddingProvider || "openai"
  const model = settings?.embeddingModel || "text-embedding-3-small"
  const apiKey = settings?.aiApiKey || process.env.OPENAI_API_KEY // Use default env var if undefined

  switch (provider) {
    case "ollama":
      return new OllamaEmbeddings({
        baseUrl: "http://localhost:11434",
        model: model,
      })
    case "openai":
    default:
      return new OpenAIEmbeddings({
        openAIApiKey: apiKey,
        modelName: model,
      })
  }
}
