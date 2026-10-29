# DEPLOYMENT_AUDIT.md

## Discovered Architecture
- Frontend: React 18 + TypeScript + Vite (port 5173), Tailwind CSS
- Backend: Express + TypeScript + Mongoose (port 5000)
- Database: MongoDB (persistent via MONGODB_URI, or MongoMemoryServer in dev)
- Auth: JWT access/refresh, RBAC, workspace scoping
- Realtime: Socket.IO
- Uploads: multer (local storage dir)
- Tests: Vitest (server), 42 tests

## Issues / Risks
- MongoMemoryServer is unstable in this environment (fassert); use persistent MongoDB (Atlas) for deployment
- Rate limiter in-memory (use Redis for multi-instance)
- Email/SMS/AI/payments require provider credentials
- Demo seed disabled by default (SEED_ON_START=false)

## Recommended Strategy
- Frontend: Vercel/Cloudflare Pages
- Backend: Render/Railway/Fly.io
- Database: MongoDB Atlas
- Source: GitHub with auto-deploy

## Required Credentials
- MONGODB_URI (Atlas)
- JWT_SECRET, JWT_REFRESH_SECRET (strong)
- Optional: REDIS_URL, AI_API_KEY, SMTP_*, RAZORPAY_*, GOOGLE_PLACES_API_KEY, VITE_GOOGLE_MAPS_API_KEY
