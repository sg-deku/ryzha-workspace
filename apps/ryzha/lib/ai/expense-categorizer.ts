import OpenAI from "openai"
import { redis } from "@/lib/redis"

let openaiInstance: OpenAI | null = null

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable")
    }
    openaiInstance = new OpenAI({ apiKey })
  }
  return openaiInstance
}

const categories = [
  "Software & SaaS",
  "Hardware",
  "Office Supplies",
  "Meals & Entertainment",
  "Travel",
  "Marketing",
  "Legal",
  "Contractors",
  "Rent",
  "Utilities",
  "Other"
]

export async function categorizeExpense(description: string, amount: number, organizationId?: string, vendor?: string) {
  const cacheKey = `expense:category:${(vendor || description).toLowerCase().replace(/\s+/g, "_")}`
  
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`)
      const result = JSON.parse(cached)
      return { ...result, confidence: 1.0 } // High confidence for cached results
    }
  } catch (err) {
    console.warn("Redis cache error:", err)
  }

  // Get recent corrections for few-shot learning
  let fewShotExamples = ""
  if (organizationId) {
    try {
      const corrections = await redis.lrange(`corrections:org:${organizationId}`, 0, 4)
      if (corrections.length > 0) {
        fewShotExamples = "\nHere are some examples of how you categorized expenses for this user previously:\n"
        corrections.forEach(c => {
          const data = JSON.parse(c)
          fewShotExamples += `- Description: "${data.description}" -> Category: "${data.category}", Tax Relevant: ${data.taxRelevant}\n`
        })
      }
    } catch (err) {
      console.warn("Error fetching corrections from Redis:", err)
    }
  }

  let retries = 3
  let lastError: any

  while (retries >= 0) {
    try {
      const prompt = `You are an expense categorizer for startup accounting.
${fewShotExamples}
Transaction: Description: "${description}", Amount: ${amount}, Vendor: ${vendor || "unknown"}.
Choose best category from: ${categories.join(", ")}. Also decide tax-deductible (true/false).
Return JSON: { "category": string, "taxRelevant": boolean, "confidence": 0-1 }`

      const openai = getOpenAI()
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(completion.choices[0].message.content || "{}")
      const finalResult = { 
        category: result.category || "Other",
        taxRelevant: result.taxRelevant ?? false,
        confidence: result.confidence ?? 0.5 
      }

      // Cache the result if confidence is high
      if (finalResult.confidence > 0.8) {
        try {
          await redis.set(cacheKey, JSON.stringify({
            category: finalResult.category,
            taxRelevant: finalResult.taxRelevant
          }), "EX", 60 * 60 * 24 * 30) // Cache for 30 days
        } catch (err) {
          console.warn("Redis set error:", err)
        }
      }

      return finalResult
    } catch (error) {
      lastError = error
      retries--
      if (retries >= 0) {
        const delay = Math.pow(2, 3 - retries) * 1000 // Exponential backoff: 2s, 4s, 8s
        console.warn(`AI categorization failed, retrying in ${delay}ms... (${retries} left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error("AI categorization failed after retries:", lastError)
  throw lastError
}
