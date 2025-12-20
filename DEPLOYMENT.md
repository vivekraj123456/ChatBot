# Deployment Guide

This guide covers deploying the AI Live Chat Agent to various platforms.

## Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment (Optional)**
   - By default, uses Vercel AI Gateway (no API key needed)
   - To use your own OpenAI key:
     - Go to Project Settings → Environment Variables
     - Add `OPENAI_API_KEY` with your key

4. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Your app is live!

### Important Notes

**SQLite Limitation on Vercel:**
- Vercel uses ephemeral file system
- `/tmp/chat.db` is recreated on each deployment
- **All conversations are lost on redeployment**
- For production, migrate to PostgreSQL (see below)

### Migrate to PostgreSQL (Production)

To persist data across deployments:

1. **Add PostgreSQL Database**
   - Vercel Postgres, Neon, or Supabase
   - Get connection string

2. **Update `lib/db.ts`**
   ```typescript
   import { neon } from '@neondatabase/serverless'
   
   const sql = neon(process.env.DATABASE_URL!)
   
   // Rewrite queries to use parameterized SQL
   // Convert from SQLite to PostgreSQL syntax
   ```

3. **Update Migrations**
   ```sql
   -- PostgreSQL uses SERIAL instead of AUTOINCREMENT
   -- Use BYTEA for UUIDs or keep TEXT
   -- CURRENT_TIMESTAMP works the same
   ```

## Railway

1. **Create New Project**
   - Connect GitHub repo
   - Railway auto-detects Next.js

2. **Add Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway provides `DATABASE_URL` automatically

3. **Environment Variables**
   - Add `OPENAI_API_KEY` if not using AI Gateway
   - `NODE_ENV=production`

4. **Deploy**
   - Push to GitHub
   - Railway auto-deploys

## Render

1. **Create Web Service**
   - Connect GitHub repo
   - Environment: Node

2. **Configure Build**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Database**
   - Create PostgreSQL instance
   - Link to web service

4. **Environment Variables**
   - Add `DATABASE_URL` from PostgreSQL instance
   - Add `OPENAI_API_KEY` if needed

## Self-Hosted (VPS/Docker)

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_PATH=/data/chat.db
       volumes:
         - ./data:/data
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

### Direct VPS Deployment

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd ai-chat-agent
   npm ci --only=production
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "chat-agent" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | No* | OpenAI API key | Uses AI Gateway |
| `NODE_ENV` | No | Environment | development |
| `DATABASE_PATH` | No | SQLite file location | ./chat.db (dev), /tmp/chat.db (prod) |
| `DATABASE_URL` | No** | PostgreSQL connection | Not used (SQLite) |

\* Only required if not using Vercel AI Gateway  
\** Only if migrating to PostgreSQL

## Health Checks

Add a health check endpoint for monitoring:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET() {
  try {
    const db = getDatabase()
    // Test database connection
    db.prepare('SELECT 1').get()
    
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: 'Database connection failed'
    }, { status: 500 })
  }
}
```

## Monitoring

### Vercel
- Built-in analytics at vercel.com/dashboard
- Real-time logs
- Error tracking

### Self-Hosted
1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs
   ```

2. **Log Management**
   - Use Winston or Pino for structured logging
   - Ship logs to Logtail, Papertrail, or CloudWatch

3. **Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - Better Uptime

## Backup & Recovery

### SQLite Backup
```bash
# Backup
sqlite3 chat.db ".backup chat-backup.db"

# Restore
cp chat-backup.db chat.db
```

### Automated Backups (Cron)
```bash
# Add to crontab
0 2 * * * sqlite3 /app/chat.db ".backup /backups/chat-$(date +\%Y\%m\%d).db"
```

## Performance Optimization

1. **Enable Caching**
   - Add Redis for session storage
   - Cache FAQ responses

2. **CDN**
   - Vercel Edge Network (automatic)
   - CloudFlare for static assets

3. **Database Optimization**
   - Keep SQLite for <10k conversations
   - Migrate to PostgreSQL for scale
   - Add connection pooling

## Security Checklist

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] No API keys in code
- [ ] Rate limiting implemented
- [ ] Input validation active
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configured properly
- [ ] Security headers set

## Troubleshooting

### Database Not Persisting
- Check file permissions
- Verify DATABASE_PATH
- Consider PostgreSQL for production

### API Key Errors
- Verify OPENAI_API_KEY is set
- Check AI Gateway configuration
- Review Vercel environment variables

### Build Failures
- Run `npm run build` locally first
- Check Node.js version (18+)
- Verify all dependencies installed

### Memory Issues
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Optimize database queries
- Add pagination for large datasets
