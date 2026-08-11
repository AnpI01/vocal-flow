# Vocal Flow

Clone a voice from a short audio sample, then generate speech in that voice
from any text script. Vocal Flow pairs a Python inference service (running a
local Qwen3-TTS model) with a Next.js web app that handles accounts, voice
management, and background job orchestration.

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐
│   apps/web (Node)    │        │  services/tts-api (Python)│
│                       │        │                            │
│  Next.js App Router   │  HTTP  │  FastAPI                  │
│  Auth.js (email/pw)   │───────▶│  Qwen3-TTS (local model)  │
│  Prisma + PostgreSQL  │  server │  Voice cloning + generation│
│  pg-boss job queue    │  -side  │                            │
└─────────────────────┘  only   └──────────────────────────┘
```

The Python service is **never called from the browser** - only from the
Node.js server (API routes and the background job worker). This keeps the
inference service private and lets the web app control auth, rate limiting,
and job orchestration independently of the model itself.

### Why a background job queue

TTS generation can take anywhere from several seconds to a couple of minutes
depending on script length and hardware (this project runs CPU-only). Blocking an HTTP request for that
long isn't viable, so generation requests are queued (`pg-boss`, running on
top of the same PostgreSQL database - no separate Redis needed) and the
frontend polls for status until the job completes.

### The `voice_request_id::transaction_id` convention

The Python service caches each voice's clone-prompt keyed by the `request_id`
used when it was created via `/prompt`. Every `/generate` call for that voice
must reuse the *same* `request_id` to find that cached prompt - but Python
also names its output file after that same ID, meaning naively reusing it
would cause concurrent or repeated generations for one voice to overwrite
each other's output mid-write.

The fix: the Node.js worker sends a combined identifier,
`"<voice_request_id>::<transaction_id>"`, where `transaction_id` is the
generation job's own unique ID. The Python service splits this on `::`,
using the first half to find the cached prompt and the second half to name
the output file - so every generation gets a unique output path while still
correctly reusing the voice's clone prompt.

## Tech stack

| Layer | Choice |
|---|---|
| Web framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Auth.js v5 (Credentials provider, JWT sessions) |
| Database | PostgreSQL, via Prisma ORM (v7, driver adapters) |
| Job queue | pg-boss (runs on the same Postgres instance) |
| TTS service | FastAPI (Python), Qwen3-TTS (`Qwen/Qwen3-TTS-12Hz-1.7B-Base`) |
| Python deps | Managed via `uv` |
| Containerization | Docker Compose (Postgres, TTS API, web app) |

## Project structure

```
vocal-flow/
├── docker-compose.yml
├── .env                          # AUTH_SECRET (see Setup)
│
├── apps/
│   └── web/                      # Next.js app
│       ├── prisma/schema.prisma  # User, Voice, GenerationJob models
│       ├── prisma.config.ts      # Prisma 7 connection config
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # login, register
│           │   └── (dashboard)/  # voices, generate, history
│           ├── lib/              # db client, auth config, tts-client, job-queue
│           └── components/
│
└── services/
    └── tts-api/                  # FastAPI TTS service
        ├── app/
        │   ├── engines/          # Qwen3-TTS wrapper, swappable via base.py interface
        │   ├── services/         # request orchestration
        │   └── storage/          # local file handling
        └── Dockerfile
```

## Features

- Email/password registration and login
- Upload a voice sample (WAV + transcript) to create a reusable voice clone
- Mark voices public (visible to all users) or private
- Generate speech from text using any owned or public voice, in English,
  Chinese, Japanese, or Korean
- Background job processing with live status polling
- Generation history with playback and download

## Setup

### Prerequisites

- Docker Desktop (with WSL2 backend on Windows)
- Node.js 22+ and `uv` (only needed for local dev outside Docker)

### 1. Clone and configure environment

```bash
git clone <repo-url> vocal-flow
cd vocal-flow

# Root .env - used by docker-compose.yml
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
```

For local (non-Docker) web development, also create `apps/web/.env.local`:

```bash
DATABASE_URL="postgresql://vocalflow:vocalflow_dev_password@localhost:5432/vocalflow"
TTS_API_URL="http://localhost:8000"
TTS_API_KEY="dev-api-key-change-me"
AUTH_SECRET="<same value as root .env>"
```

### 2. Run everything via Docker Compose

```bash
docker compose build
docker compose up -d
docker compose ps   # confirm postgres, tts-api, and web are all Up
```

Apply database migrations (first run only):

```bash
docker compose exec web npx prisma migrate deploy
```

Visit `http://localhost:3000`.

### 3. (Alternative) Local development for the web app

Run Postgres and the TTS service in Docker, but the web app directly for
hot-reload:

```bash
docker compose up -d postgres tts-api
cd apps/web
npm install
npx prisma migrate dev
npm run dev
```



## License

Add a license before making this repository public.
