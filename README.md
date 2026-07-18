# DoodleDash 🎨⚡

**Real-time multiplayer drawing & guessing party game.**  
Draw it. Guess it. Dash to the top of the leaderboard.

---

## What is DoodleDash?

DoodleDash is a party game for 2–8 players. Each round, one player becomes the **Doodler** and has 60 seconds to draw a secret word on the canvas. Everyone else races to **guess** the word in chat. Fast guesses earn more points. The player with the highest score after all rounds wins.

Think Skribbl.io — polished, responsive, dark-themed.

---

## Quick Features

| | |
|---|---|
| 🎨 **Canvas Drawing** | Smooth strokes, color palette, brush sizes, undo/clear |
| ⚡ **Real-time** | WebSocket-powered, sub-50ms latency |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 🏆 **Scoring** | Speed-based guessing rewards (50–200 pts) |
| 🎮 **Room Codes** | 6-character codes to invite friends |
| 🌙 **Dark Theme** | Custom design system with purple accent |
| 🕹️ **Configurable** | Draw time, rounds, word categories |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 + React 18 + TypeScript |
| Styling | Tailwind CSS (custom dark theme) |
| Real-time | Socket.IO (WebSocket) |
| Backend | Express + Socket.IO + TypeScript |
| Canvas | HTML Canvas API (custom rendering) |
| Monorepo | pnpm workspaces |

---

## How to Play

1. **Create or Join** a room from the landing page
2. **Lobby** — wait for players, host adjusts settings
3. **Draw** — when you're the Doodler, draw the secret word (no letters/numbers!)
4. **Guess** — type your guesses in chat, faster = more points
5. **Win** — highest score after all rounds wins the game

### Scoring

- **Guesser**: `50–200 pts` based on how fast you guess
- **Doodler**: `0–200 pts` based on how many people guessed correctly

---

## Quick Setup

```bash
# Prerequisites: Node.js 20+, pnpm 9+
pnpm install

# Run both server and frontend (concurrent)
pnpm dev
```

- **Frontend**: http://localhost:3000
- **Server**: http://localhost:3001

---

## Project Structure

```
doodledash/
├── frontend/          # Next.js app (React, Tailwind)
│   ├── src/
│   │   ├── app/       # Pages (landing, game room)
│   │   ├── components/# UI, lobby, and game components
│   │   ├── hooks/     # useGame, useCanvas, useSocket, useTimer
│   │   └── lib/       # Socket.IO client
├── server/            # Express + Socket.IO game server
│   └── src/           # Room manager, game manager, word bank, scoring
└── shared/            # Shared TypeScript types
```

---

## Environment Variables

| Variable | Default | Where |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | `frontend/.env.local` |
| `PORT` | `3001` | Server env |

---

## Commands

```bash
pnpm dev          # Run dev servers (frontend + backend)
pnpm build        # Build all packages
pnpm start        # Start production server
```

---

## License

MIT
