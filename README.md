# Replify

> AI-powered customer support ticket analysis and response generation.

Built with **Next.js 14 App Router**, **Supabase**, **Ollama (Llama3/Mistral)**, and **Tailwind CSS**.

---

## Features

- 🤖 **AI Ticket Analyzer** — categorize, score urgency, and generate replies
- 📊 **Insights Dashboard** — recurring issue detection and pattern analysis
- 💾 **Saved Replies** — build a library of approved AI responses
- 🔒 **Supabase Auth** — email/password + Google OAuth
- 🏠 **Local AI** — runs on Ollama (Llama3 or Mistral), no cloud AI costs
- ☁️ **Cloud fallback** — falls back to Anthropic Claude if Ollama is offline

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | Next.js 14 (App Router)       |
| Styling     | Tailwind CSS                  |
| Database    | Supabase (PostgreSQL)         |
| Auth        | Supabase Auth                 |
| AI (local)  | Ollama + Llama3 or Mistral    |
| AI (cloud)  | Anthropic Claude (fallback)   |
| Hosting     | Vercel                        |
| Charts      | Recharts                      |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/Replify.git
cd Replify
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. In **Authentication → Providers**, enable Google (optional).
4. Copy your project URL and anon key.

### 3. Set up Ollama (local AI)

```bash
# Install Ollama — https://ollama.com
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (choose one)
ollama pull llama3        # recommended
ollama pull mistral       # lighter alternative

# Start Ollama server (runs on port 11434 by default)
ollama serve
```

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Ollama (local AI — default settings work if running locally)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Anthropic (optional cloud fallback)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
Replify/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts      # OAuth callback
│   ├── dashboard/page.tsx
│   ├── analyze-ticket/page.tsx
│   ├── insights/page.tsx
│   ├── saved-replies/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── analyze-ticket/route.ts
│       ├── save-response/route.ts
│       └── insights/route.ts
├── components/
│   ├── layout/                    # Navbar, Sidebar, AppShell
│   ├── ui/                        # Badge, MetricCard, ConfidenceBar
│   ├── dashboard/                 # TicketRow, IssueBar, VolumeChart
│   ├── analyzer/                  # TicketForm, AIResultCard
│   ├── landing/                   # Hero, Features, Pricing, etc.
│   ├── SavedRepliesList.tsx
│   └── SettingsClient.tsx
├── lib/
│   ├── ai.ts                      # Ollama + Anthropic AI logic
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server component client
│       └── middleware.ts          # Auth middleware
├── types/index.ts
├── middleware.ts                  # Route protection
├── supabase/schema.sql            # Database schema
└── .env.local.example
```

---

## API Endpoints

### `POST /api/analyze-ticket`
Analyzes a support ticket using AI.

**Request body:**
```json
{
  "ticket_text": "Customer message here...",
  "customer_tier": "Pro"
}
```

**Response:**
```json
{
  "category": "Account",
  "urgency": "Urgent",
  "sentiment": "Frustrated",
  "confidence": 94,
  "summary": "Customer locked out after password reset",
  "suggested_reply": "Hi there! I understand how frustrating...",
  "ticket_id": "uuid-of-saved-ticket"
}
```

### `POST /api/save-response`
Saves an AI-generated reply to the user's library.

### `GET /api/save-response`
Returns all saved replies for the authenticated user.

### `GET /api/insights`
Returns 30-day analytics: category distribution, volume, knowledge gaps.

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# (same as .env.local.example)
```

**Note:** Ollama runs locally so for production you'll either:
- Self-host Ollama on a server and set `OLLAMA_BASE_URL` to its URL
- Use the Anthropic fallback by setting `ANTHROPIC_API_KEY`

---

## Database Schema

| Table             | Description                          |
|-------------------|--------------------------------------|
| `users`           | User profiles (mirrors auth.users)   |
| `tickets`         | Analyzed support tickets             |
| `saved_responses` | Library of approved AI replies       |
| `insights`        | Aggregated analytics snapshots       |

All tables use Row Level Security (RLS) — users can only access their own data.

---

## License

MIT
