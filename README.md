# AI Live Chat Agent - Spur Take-Home Assignment

A full-stack AI-powered customer support chat application built with Next.js, TypeScript, and SQLite. Features a real-time chat interface with an LLM-powered support agent that can answer customer questions about shipping, returns, support hours, and more.

## Features

- **Real-time AI Chat**: Interactive chat interface with an AI agent powered by OpenAI
- **Persistent Conversations**: SQLite database stores all conversations and messages
- **Session Management**: Conversations persist across page reloads
- **FAQ Knowledge Base**: Pre-seeded with store policies (shipping, returns, support hours, etc.)
- **Robust Error Handling**: Graceful handling of API failures, rate limits, and network issues
- **Input Validation**: Prevents empty messages, handles long inputs, validates all user input
- **Clean Architecture**: Separated concerns with services, routes, and components
- **Responsive UI**: Mobile-friendly chat interface with typing indicators and auto-scroll

## Tech Stack

- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes, TypeScript
- **Database**: SQLite with better-sqlite3
- **LLM Integration**: Vercel AI SDK with OpenAI (via AI Gateway)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Validation**: Input sanitization and length limits

## Architecture Overview

### Backend Structure

```
lib/
├── db.ts          # SQLite database client, schema, and CRUD operations
├── llm.ts         # LLM integration and prompt engineering
└── utils.ts       # Utility functions (cn for classnames)

app/api/
├── chat/
│   ├── message/route.ts   # POST endpoint for sending messages
│   └── history/route.ts   # GET endpoint for fetching conversation history

scripts/
├── 001_create_tables.sql  # Database schema initialization
└── 002_seed_faq_data.sql  # FAQ knowledge base seed data
```

### Frontend Structure

```
app/
├── page.tsx       # Main chat interface (client component)
├── layout.tsx     # Root layout with metadata
└── globals.css    # Global styles and Tailwind config

components/
├── chat-message.tsx      # Individual message bubble component
├── chat-input.tsx        # Message input with send button
├── typing-indicator.tsx  # "Agent is typing..." animation
└── ui/                   # shadcn/ui base components
```

### Data Model

**conversations** table:
- `id` (TEXT, PRIMARY KEY): Unique conversation ID (UUID)
- `created_at` (TIMESTAMP): Conversation start time
- `updated_at` (TIMESTAMP): Last message time

**messages** table:
- `id` (TEXT, PRIMARY KEY): Unique message ID (UUID)
- `conversation_id` (TEXT, FOREIGN KEY): Links to conversation
- `sender` (TEXT): Either "user" or "ai"
- `text` (TEXT): Message content
- `created_at` (TIMESTAMP): Message timestamp

**faq_knowledge** table:
- `id` (TEXT, PRIMARY KEY): Unique FAQ ID
- `category` (TEXT): Category (shipping, returns, support, etc.)
- `question` (TEXT): FAQ question
- `answer` (TEXT): FAQ answer
- `created_at` (TIMESTAMP): Record creation time

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Gemini API Key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-chat-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

If you want to use your own OpenAI API key, set:

```
GOOGLE_API_KEY=your_google_api_key_here
```


### 4. Initialize Database

The database is automatically initialized when the server starts. The SQLite database file (`chat.db`) will be created in the project root.

**Database Setup**

The project uses SQLite. No database file is committed.

On the first run, the app will automatically:
- Create the database tables (`scripts/001_create_tables.sql`)
- Seed the FAQ data (`scripts/002_seed_faq_data.sql`)

No manual setup is required.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Test the Application

Try asking questions like:
- "What is your shipping policy?"
- "Do you ship internationally?"
- "How do I return an item?"
- "What are your support hours?"
- "What payment methods do you accept?"

## LLM Integration Details


### Prompt Engineering
The system prompt includes:
- Role definition (helpful support agent)
- FAQ knowledge base context
- Conversation history (last 10 messages)
- Guidelines for tone and behavior
- Instructions for handling unknown questions

### Error Handling

### Cost Control
- Max tokens limited to 500 per response
- Conversation history capped at last 10 messages
- Input messages truncated at 2000 characters
- Request-level validation prevents abuse

## API Endpoints

### POST `/api/chat/message`
Send a message and get AI response.

**Request:**
```json
{
  "message": "What is your return policy?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "reply": "We accept returns within 30 days...",
  "sessionId": "uuid-of-conversation"
}
```

**Error Responses:**
- `400`: Invalid input (empty message, too long, wrong type)
- `500`: Server error (LLM failure, database error)

### GET `/api/chat/history?sessionId=<id>`
Fetch conversation history.

**Response:**
```json
{
  "sessionId": "uuid",
  "messages": [
    {
      "id": "msg-uuid",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Input Validation & Robustness

### Client-Side
- Disabled send button while loading
- Empty message prevention
- Textarea with Enter to send, Shift+Enter for new line
- Auto-scroll to latest message
- Error state display

### Server-Side
- Message type validation (must be string)
- Empty message rejection
- Length limits (5000 characters max)
- SQL injection prevention (parameterized queries)
- Graceful LLM error handling
- Database error recovery

## Design Decisions

### Why Vercel AI SDK?
- **Provider-agnostic**: Easy to switch between OpenAI, Anthropic, etc.
- **AI Gateway integration**: Zero-config in development
- **Type-safe**: Full TypeScript support
- **Streaming support**: Can easily add streaming responses later

### Architecture Choices
- **Service layer pattern**: Separates database logic from routes
- **Singleton database client**: Prevents connection pool exhaustion
- **UUID for IDs**: Avoids sequential ID guessing
- **Timestamp indexes**: Fast chronological queries
- **Foreign key constraints**: Data integrity

## Trade-offs & "If I Had More Time..."

### Current Limitations
1. **No authentication**: All conversations are public (would add user accounts)
2. **Single SQLite file**: Not ideal for multi-instance deployments (would use PostgreSQL)
3. **No streaming**: Responses appear all at once (would add streaming for better UX)
4. **Basic error messages**: Could be more specific and actionable
5. **No rate limiting**: Per-user rate limiting would prevent abuse
6. **No conversation titles**: Hard to navigate multiple conversations
7. **No admin dashboard**: Can't view/manage conversations in a UI

### Future Enhancements
- **User authentication**: Secure user accounts with conversation ownership
- **Streaming responses**: Real-time token-by-token responses
- **Rich messages**: Support images, links, buttons, carousels
- **Multi-channel**: WhatsApp, Instagram, Facebook Messenger integrations
- **Admin panel**: View conversations, analytics, manual intervention
- **A/B testing**: Test different prompts and agent personalities
- **Sentiment analysis**: Track customer satisfaction
- **Handoff to human**: Escalate complex issues to human agents
- **Search**: Full-text search across conversations
- **Export**: Download conversation history

## Testing the App

### Manual Test Cases

1. **Basic conversation flow**
   - Send a message, receive a response
   - Verify message appears in chat
   - Check auto-scroll behavior

2. **FAQ accuracy**
   - Ask about shipping policy
   - Ask about returns
   - Ask about support hours
   - Verify answers match seeded data

3. **Session persistence**
   - Send messages
   - Refresh the page
   - Verify conversation history loads

4. **Error handling**
   - Try empty message (should be blocked)
   - Try very long message (should be truncated)
   - Disconnect network (should show error)

5. **New conversation**
   - Click "New Chat" button
   - Verify fresh conversation starts
   - Check old conversation is saved

### Edge Cases Handled
- Empty/whitespace-only messages
- Very long messages (5000+ characters)
- Special characters and Unicode
- Rapid message sending
- Network failures
- LLM API errors
- Database write failures
- Malformed API requests

## Production Deployment

### Environment Variables Required
```
GOOGLE_API_KEY=your_key_here
```

### Vercel Deployment
1. Push to GitHub
2. Import project in Vercel
3. Deploy (zero additional config needed)

### Database in Production
- SQLite file stored in `/tmp/chat.db`
- Ephemeral file system means conversations are lost on redeployment
- **Recommendation**: Migrate to PostgreSQL (Neon, Supabase) for production


## License

MIT

## Author

Built for Spur founding engineer take-home assignment.
