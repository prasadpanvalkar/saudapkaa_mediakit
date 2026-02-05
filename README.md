# Saudapakka Development

## Prerequisites
- Docker
- Docker Compose
- Node.js (for local frontend dev, optional)
- Python (for local backend dev, optional)

## Setup

1. **Environment Variables**
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```
   > **Note**: Update the values in `.env` with your actual secrets. Do NOT commit `.env` to version control.

2. **Start Development Server**
   Use the provided script to start the application in development mode:
   ```bash
   ./start_dev.sh
   # OR on Windows
   ./start_dev.bat
   ```

   This will start:
   - Backend on http://localhost:8005 (proxying port 8000)
   - Frontend on http://localhost:3010 (proxying port 3000)
   - Postgres Database

## Architecture
- **Backend**: Django Rest Framework
- **Frontend**: Next.js (TypeScript)
- **Database**: PostgreSQL (with pgvector)

## Issues/Notes
- Ensure ports 8005, 3010, and 5433 are free on your host machine.
- Frontend API calls are routed via `src/lib/axios.ts`.
