import { type NextRequest, NextResponse } from "next/server"
import { messageService, conversationService } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    // Check if conversation exists
    const conversation = conversationService.findById(sessionId)
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages
    const messages = messageService.findByConversationId(sessionId)

    return NextResponse.json({
      sessionId,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.created_at,
      })),
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch conversation history",
      },
      { status: 500 },
    )
  }
}
