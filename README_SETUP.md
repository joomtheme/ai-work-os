# AI Work OS Setup

## Quick Start

Requirements:
- Node.js 20+
- Docker
- Docker Compose

Clone and run:

```bash
git clone https://github.com/joomtheme/ai-work-os.git
cd ai-work-os
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

## Services

- PostgreSQL: application data
- Redis: mission queue
- API: AI Work OS backend
- Web: Mission dashboard

## First Mission

Create a mission and follow:

Mission → Planner → Agent → Tools → Memory → Evidence → Result
