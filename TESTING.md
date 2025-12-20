# Testing Guide

Comprehensive testing instructions for the AI Live Chat Agent.

## Manual Testing

### Test Case 1: Basic Chat Flow

**Objective**: Verify basic send/receive functionality

1. Open application at http://localhost:3000
2. Type "Hello" in the input box
3. Press Enter or click Send button

**Expected Result**:
- Message appears in chat with user avatar
- Loading indicator shows briefly
- AI response appears with bot avatar
- Both messages have timestamps
- Chat scrolls to bottom automatically

### Test Case 2: FAQ Knowledge Base

**Objective**: Verify AI has access to seeded knowledge

Test each FAQ category:

**Shipping Questions:**
```
User: "What is your shipping policy?"
Expected: Response mentions free shipping over $50, standard 5-7 days

User: "Do you ship internationally?"
Expected: Response mentions 100+ countries, 10-15 days
```

**Return Questions:**
```
User: "What is your return policy?"
Expected: Response mentions 30 days, unused, original packaging

User: "How do I return something?"
Expected: Response mentions returns@example.com, prepaid label
```

**Support Questions:**
```
User: "What are your support hours?"
Expected: Response mentions Monday-Friday 9 AM - 6 PM EST, 24/7 email
```

**Payment Questions:**
```
User: "What payment methods do you accept?"
Expected: Response mentions credit cards, PayPal, Apple Pay, Google Pay
```

### Test Case 3: Session Persistence

**Objective**: Verify conversations persist across page reloads

1. Send several messages
2. Note the conversation content
3. Refresh the page (F5 or Cmd+R)

**Expected Result**:
- All previous messages reload
- Conversation continues seamlessly
- Session ID preserved in sessionStorage

### Test Case 4: New Conversation

**Objective**: Verify new chat functionality

1. Have an active conversation with multiple messages
2. Click "New Chat" button
3. Send a new message

**Expected Result**:
- Chat clears to welcome message only
- New session ID generated
- Old conversation preserved in database
- Can no longer see old messages

### Test Case 5: Input Validation

**Objective**: Verify client-side validation

**Empty Message:**
1. Try to send empty message
**Expected**: Send button disabled

**Whitespace Only:**
1. Type only spaces
2. Try to send
**Expected**: Send button disabled

**Very Long Message:**
1. Paste text longer than 5000 characters
2. Send message
**Expected**: Server returns 400 error with helpful message

### Test Case 6: Error Handling

**Objective**: Verify graceful error handling

**Network Error Simulation:**
1. Open browser DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to send a message

**Expected Result**:
- Error message appears in chat
- User can retry after going back online
- Application doesn't crash

**Invalid Session ID:**
1. Open DevTools console
2. Run: `sessionStorage.setItem('chatSessionId', 'invalid-id')`
3. Refresh page
4. Send a message

**Expected Result**:
- New session created automatically
- Message sends successfully

### Test Case 7: UI/UX Elements

**Objective**: Verify all UI interactions work

- [ ] Typing indicator appears when waiting for response
- [ ] Send button disables during API call
- [ ] Chat auto-scrolls to latest message
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Messages wrap properly with long text
- [ ] Timestamps display correctly
- [ ] User/AI avatars display correctly

### Test Case 8: Conversation Context

**Objective**: Verify AI maintains conversation context

1. Send: "What is your return policy?"
2. Wait for response
3. Send: "How long does the refund take?"
4. Wait for response

**Expected Result**:
- AI understands "the refund" refers to returns
- Response is contextual (mentions 5-7 business days)
- Doesn't ask "what refund?"

### Test Case 9: Multiple Browser Sessions

**Objective**: Verify session isolation

1. Open app in Chrome
2. Send messages, note session ID (in DevTools → Application → Session Storage)
3. Open app in Firefox
4. Send different messages

**Expected Result**:
- Each browser has separate conversation
- Different session IDs
- No cross-contamination of messages

## API Testing

### Using curl

**Test POST /api/chat/message:**

```bash
# New conversation
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your return policy?"}'

# Response should include sessionId

# Continue conversation
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Thank you",
    "sessionId": "<session-id-from-previous-response>"
  }'
```

**Test GET /api/chat/history:**

```bash
curl "http://localhost:3000/api/chat/history?sessionId=<session-id>"
```

**Test Error Cases:**

```bash
# Empty message (should return 400)
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'

# No message field (should return 400)
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid session ID (should create new session)
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "invalid"}'
```

## Database Testing

### Verify Tables Created

```bash
sqlite3 chat.db ".tables"
# Should show: conversations  faq_knowledge  messages
```

### Check FAQ Seed Data

```bash
sqlite3 chat.db "SELECT COUNT(*) FROM faq_knowledge;"
# Should return: 7
```

### Inspect Conversations

```bash
# List all conversations
sqlite3 chat.db "SELECT * FROM conversations;"

# List messages for a specific conversation
sqlite3 chat.db "SELECT * FROM messages WHERE conversation_id='<id>' ORDER BY created_at;"

# Count total messages
sqlite3 chat.db "SELECT COUNT(*) FROM messages;"
```

### Test Data Integrity

```bash
# Check foreign key relationships
sqlite3 chat.db "PRAGMA foreign_keys=ON; DELETE FROM conversations WHERE id='<some-id>';"
# Messages should cascade delete

# Check indexes exist
sqlite3 chat.db ".indexes messages"
# Should show: idx_messages_conversation_id, idx_messages_created_at
```

## Load Testing

### Using Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Ubuntu/Debian
brew install apache-bench            # macOS

# Simple load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p message.json -T application/json \
  http://localhost:3000/api/chat/message
```

**message.json:**
```json
{"message": "What is your shipping policy?"}
```

### Expected Performance

- **P50 latency**: < 500ms (depends on LLM API)
- **P95 latency**: < 2000ms
- **Error rate**: < 1%
- **Throughput**: 10+ req/sec (limited by LLM API)

## Edge Cases to Test

### Input Edge Cases
- [ ] Empty message
- [ ] Only whitespace
- [ ] Very long message (5000+ chars)
- [ ] Special characters: `<script>alert('xss')</script>`
- [ ] Unicode: 你好, مرحبا, 👋
- [ ] SQL injection attempt: `'; DROP TABLE messages; --`
- [ ] Newlines and formatting

### Session Edge Cases
- [ ] No session ID (new conversation)
- [ ] Invalid session ID (UUID that doesn't exist)
- [ ] Expired session ID
- [ ] Malformed session ID (not a UUID)

### API Edge Cases
- [ ] Missing Content-Type header
- [ ] Invalid JSON body
- [ ] Large payload (> 10MB)
- [ ] Rapid successive requests (rate limiting)

### Database Edge Cases
- [ ] Database file deleted while running
- [ ] Database locked (multiple writers)
- [ ] Disk full
- [ ] Permission denied

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader announces messages
- [ ] Focus visible on interactive elements
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

### Using axe DevTools

1. Install axe DevTools browser extension
2. Open app
3. Run accessibility scan
4. Fix any violations

## Security Testing

### XSS Prevention
```javascript
// Try injecting script
message: "<script>alert('XSS')</script>"
// Should render as text, not execute
```

### SQL Injection Prevention
```javascript
// Try SQL injection
message: "'; DROP TABLE messages; --"
// Should be safely parameterized
```

### CSRF Protection
- Next.js API routes have built-in CSRF protection
- Verify POST requests require proper headers

## Automated Testing (Future Enhancement)

### Unit Tests (Jest + React Testing Library)

```typescript
// Example: components/__tests__/chat-message.test.tsx
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '../chat-message'

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    render(<ChatMessage sender="user" text="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  
  it('renders AI message correctly', () => {
    render(<ChatMessage sender="ai" text="Hi there!" />)
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })
})
```

### Integration Tests (Playwright)

```typescript
// Example: e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test'

test('basic chat flow', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  await page.fill('textarea', 'What is your return policy?')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=30 days')).toBeVisible({ timeout: 10000 })
})
```

## Test Checklist

Before considering testing complete:

- [ ] All manual test cases pass
- [ ] API endpoints return expected responses
- [ ] Database persists data correctly
- [ ] Error handling works gracefully
- [ ] Session management functions properly
- [ ] FAQ knowledge is accurate
- [ ] UI is responsive and intuitive
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Performance is acceptable
- [ ] Security vulnerabilities addressed

## Reporting Issues

When reporting bugs, include:

1. **Environment**: Browser, OS, Node version
2. **Steps to reproduce**: Exact sequence of actions
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happened
5. **Screenshots**: Visual evidence
6. **Console logs**: Browser and server errors
7. **Session ID**: For conversation-specific issues
