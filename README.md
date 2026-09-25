# MeetFlow AI

**AI Meeting Productivity Agent** — paste any meeting transcript and let the AI agent extract structured summaries, decisions, and actionable task items in real time. Features a high-tech animated robot mascot, live reasoning terminal, and an interactive task dashboard.

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 13 (App Router, React 18)   |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS                        |
| Animation   | Framer Motion                       |
| Icons       | Lucide React                        |
| AI / LLM    | Google GenAI SDK (`gemini-2.5-flash` default) |
| Integrations| Swytchcode API (server-side)        |
| Deployment  | Vercel-ready                        |

## Features

### 1. Interactive AI Robot Mascot
A pure CSS/SVG robot with five reactive visual states — **idle, thinking, talking, success, error** — including animated eyes, a glowing reactor core, orbiting particles, and audio wave bars.

### 2. Live Reasoning Terminal
A cyberpunk-style terminal that streams step-by-step AI agent execution logs in real time: parsing, analyzing, extracting action items, calling Swytchcode tools, and generating the final summary.

### 3. Real AI Processing
The `/api/agent` route sends your transcript to Google Gemini with a structured JSON prompt that extracts:
- Executive summary (3–5 sentences)
- Key discussion points
- Decisions made (with rationale)
- Action items (title, owner, priority, due date)
- Sentiment analysis & topic tags

### 4. Interactive Task Dashboard
- Tasks sorted by **High / Medium / Low** priority
- Inline editing of owner and priority
- Click to cycle status: Pending → In Progress → Completed
- Filter by priority and status
- Export to **JSON, CSV, or Markdown**

### 5. Swytchcode Integration
Server-side `services/swytchcode.ts` handles workflow tool execution (task creation, data export). Enable the "Sync tasks to Swytchcode" checkbox before running the agent to batch-sync action items.

## Environment Variables

Create a `.env.local` file (see `.env.example`):

```env
GEMINI_API_KEY=your-google-ai-studio-key
SWYTCHCODE_API_KEY=your-key-here
NEXT_PUBLIC_APP_NAME=MeetFlow AI
```

You can also optionally set:
```env
GEMINI_MODEL=gemini-2.5-flash  # default: gemini-2.5-flash
SWYTCHCODE_API_URL=https://api.swytchcode.com/v1  # if you have a custom endpoint
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
├── layout.tsx              # Root layout with fonts + scan-line overlay
├── page.tsx                # Main dashboard (client component)
├── globals.css             # Theme tokens + cyber HUD styles
└── api/
    └── agent/
        └── route.ts        # POST endpoint: Gemini analysis + Swytchcode sync

components/
├── RobotMascot.tsx         # Animated SVG robot (5 visual states)
├── ReasoningTerminal.tsx   # Live streaming reasoning log terminal
├── TaskDashboard.tsx       # Interactive task board with filters/export
├── AnalysisPanel.tsx       # Structured analysis display (summary, decisions)
└── CyberParticles.tsx      # Floating background particles

lib/
├── gemini.ts               # Gemini client + analyzeMeeting()
└── utils.ts                # cn() class merge utility

services/
└── swytchcode.ts           # Swytchcode API client (executeTool, createTask, export)

types/
└── index.ts                # All TypeScript interfaces
```

### Data Flow

1. User pastes transcript → clicks **Run AI Agent**
2. Client streams simulated reasoning steps to the terminal for UX
3. `POST /api/agent` calls `analyzeMeeting()` in `lib/gemini.ts`
4. Google Gemini returns structured JSON (summary, decisions, action items)
5. If Swytchcode sync is enabled, `services/swytchcode.ts` batch-creates tasks
6. Results populate the Analysis Panel + Task Dashboard
7. Robot mascot transitions: idle → thinking → success

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
    - `GEMINI_API_KEY`
   - `SWYTCHCODE_API_KEY`
   - `NEXT_PUBLIC_APP_NAME`
4. Deploy — Vercel auto-detects Next.js

## Design System

- **Electric Blue** (`#0052FF` / `#3B82F6`) — primary actions, robot idle state, borders
- **Cyber Yellow** (`#FACC15` / `#EAB308`) — accents, thinking state, export buttons
- **Slate 950 / Black** — deep dark backgrounds for high contrast
- **Glassmorphism** cards with backdrop blur and glowing borders
- **HUD grid** background with animated scan line overlay
- **Framer Motion** for all transitions, floating animations, and micro-interactions

## License

MIT
