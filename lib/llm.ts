import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { faqService, messageService, type Message } from "./db"

const MAX_HISTORY_MESSAGES = 10
const MAX_MESSAGE_LENGTH = 2000

export async function generateReply(
  conversationId: string,
  userMessage: string
): Promise<{ reply: string; error?: string }> {
  try {
    // Validate message
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error("Message cannot be empty")
    }

    // Truncate long messages
    const sanitizedMessage =
      userMessage.length > MAX_MESSAGE_LENGTH
        ? userMessage.slice(0, MAX_MESSAGE_LENGTH) + "..."
        : userMessage

    // Fetch conversation history
    const history = messageService.findByConversationId(conversationId)
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES)

    // Get FAQ knowledge base
    const knowledgeContext = faqService.getKnowledgeContext()

    // Build conversation context
    const conversationContext = recentHistory
      .map(
        (msg: Message) =>
          `${msg.sender === "user" ? "Customer" : "Agent"}: ${msg.text}`
      )
      .join("\n")

    // System prompt
    const systemPrompt = `You are a helpful and friendly customer support agent for an e-commerce store.

STORE KNOWLEDGE BASE:
${knowledgeContext}

GUIDELINES:
- Be warm, professional, and empathetic
- Answer questions using the knowledge base when applicable
- If unsure, politely say so and offer a human agent
- Keep responses concise and helpful

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n` : ""}

Now respond to the customer's latest message:`

    // Generate AI response
    const { text } = await generateText({
      model: google("models/gemini-2.5-flash"),
      prompt: `${systemPrompt}\n\nCustomer: ${sanitizedMessage}`,
      temperature: 0.7,
      // maxOutputTokens: 500, // optional: remove if SDK complains
    })

    return { reply: text.trim() }
  } catch (error: any) {
    console.error("[LLM ERROR]", error)

    if (error.message?.includes("API key")) {
      return {
        reply:
          "I'm having trouble accessing my system right now. Please contact support@example.com.",
        error: "API_KEY_ERROR",
      }
    }

    if (error.message?.includes("rate limit") || error.message?.includes("429")) {
      return {
        reply:
          "We're experiencing high traffic. Please try again shortly or email support@example.com.",
        error: "RATE_LIMIT_ERROR",
      }
    }

    if (
      error.message?.includes("timeout") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      return {
        reply:
          "I'm having connectivity issues. Please try again or contact support@example.com.",
        error: "TIMEOUT_ERROR",
      }
    }

    return {
      reply:
        "Sorry, something went wrong. Please try again or reach out to our support team.",
      error: "UNKNOWN_ERROR",
    }
  }
}
