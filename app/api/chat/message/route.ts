import { type NextRequest, NextResponse } from "next/server"
import { conversationService, messageService } from "@/lib/db"
import { generateReply } from "@/lib/llm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId } = body

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    if (message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long (max 5000 characters)" }, { status: 400 })
    }

    // Get or create conversation
    let conversationId = sessionId
    if (sessionId) {
      const existingConversation = conversationService.findById(sessionId)
      if (!existingConversation) {
        const newConversation = conversationService.create()
        conversationId = newConversation.id
      }
    } else {
      const newConversation = conversationService.create()
      conversationId = newConversation.id
    }

    // Save user message
    messageService.create(conversationId, "user", message.trim())

    // Generate AI reply
    const { reply, error } = await generateReply(conversationId, message.trim())

    // Save AI message
    messageService.create(conversationId, "ai", reply)

    return NextResponse.json({
      reply,
      sessionId: conversationId,
      ...(error && { error }),
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    )
  }
}
