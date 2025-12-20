"use client"

import { useState, useEffect, useRef } from "react"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { TypingIndicator } from "@/components/typing-indicator"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  sender: "user" | "ai"
  text: string
  timestamp: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Load conversation history from sessionStorage on mount
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("chatSessionId")
    if (savedSessionId) {
      setSessionId(savedSessionId)
      loadHistory(savedSessionId)
    } else {
      // Add welcome message for new conversations
      setMessages([
        {
          id: "welcome",
          sender: "ai",
          text: "Hello! I'm your virtual support agent. How can I help you today? Feel free to ask about shipping, returns, support hours, or anything else!",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [])

  const loadHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sid}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (err) {
      console.error("[v0] Failed to load history:", err)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    setError(null)

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: message,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send message")
      }

      const data = await response.json()

      // Save session ID for future requests
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
        sessionStorage.setItem("chatSessionId", data.sessionId)
      }

      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      console.error("[v0] Send message error:", err)
      setError(err.message || "Failed to send message. Please try again.")

      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: "ai",
        text: "I apologize, but I encountered an error. Please try again or contact our support team at support@example.com.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    sessionStorage.removeItem("chatSessionId")
    setSessionId(null)
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I'm your virtual support agent. How can I help you today? Feel free to ask about shipping, returns, support hours, or anything else!",
        timestamp: new Date().toISOString(),
      },
    ])
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="flex h-[700px] w-full max-w-4xl flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Support Agent</h1>
              <p className="text-sm text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 size-4"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New Chat
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} sender={msg.sender} text={msg.text} timestamp={msg.timestamp} />
          ))}

          {isLoading && <TypingIndicator />}

          {error && (
            <div className="my-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </Card>
    </div>
  )
}
