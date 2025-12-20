import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Initialize SQLite database
const dbPath = process.env.NODE_ENV === "production" ? "/tmp/chat.db" : join(process.cwd(), "chat.db")

let db: Database.Database

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    initializeDatabase()
  }
  return db
}

function initializeDatabase() {
  try {
    // Run migration scripts
    const createTablesSQL = readFileSync(join(process.cwd(), "scripts", "001_create_tables.sql"), "utf-8")
    const seedFaqSQL = readFileSync(join(process.cwd(), "scripts", "002_seed_faq_data.sql"), "utf-8")

    db.exec(createTablesSQL)

    // Only seed if FAQ table is empty
    const faqCount = db.prepare("SELECT COUNT(*) as count FROM faq_knowledge").get() as { count: number }
    if (faqCount.count === 0) {
      db.exec(seedFaqSQL)
    }
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
  }
}

// Types
export interface Conversation {
  id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender: "user" | "ai"
  text: string
  created_at: string
}

export interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  created_at: string
}

// Database operations
export const conversationService = {
  create: (): Conversation => {
    const id = uuidv4()
    const stmt = db.prepare("INSERT INTO conversations (id) VALUES (?)")
    stmt.run(id)
    return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Conversation
  },

  findById: (id: string): Conversation | undefined => {
    return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Conversation | undefined
  },

  updateTimestamp: (id: string): void => {
    db.prepare("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id)
  },
}

export const messageService = {
  create: (conversationId: string, sender: "user" | "ai", text: string): Message => {
    const id = uuidv4()
    const stmt = db.prepare("INSERT INTO messages (id, conversation_id, sender, text) VALUES (?, ?, ?, ?)")
    stmt.run(id, conversationId, sender, text)
    conversationService.updateTimestamp(conversationId)
    return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as Message
  },

  findByConversationId: (conversationId: string): Message[] => {
    return db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC")
      .all(conversationId) as Message[]
  },
}

export const faqService = {
  getAll: (): FAQ[] => {
    return db.prepare("SELECT * FROM faq_knowledge").all() as FAQ[]
  },

  getKnowledgeContext: (): string => {
    const faqs = faqService.getAll()
    return faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")
  },
}

// Initialize database on import
getDatabase()
