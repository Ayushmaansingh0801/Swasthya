# DEPLOYMENT_GUIDE.md

## 1. GitHub
1. Create a repo and push this project (exclude node_modules, .env, dist, uploads).

## 2. MongoDB Atlas
1. Create cluster (free M0).
2. Create DB user.
3. Network Access: allow 0.0.0.0/0 (or hosting IP).
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/swasthya`

## 3. Backend (Render/Railway)
- Build command: `npm run build --workspace=server`
- Start command: `npm run start --workspace=server`
- Env vars: see ENVIRONMENT_VARIABLES.md
- Set `MONGODB_URI`, strong JWT secrets, `NODE_ENV=production`, `SEED_ON_START=false`

## 4. Frontend (Vercel/Cloudflare)
- Build command: `npm run build --workspace=client`
- Output dir: `client/dist`
- Env: `VITE_GOOGLE_MAPS_API_KEY` (optional)

## 5. Bootstrap Admin
After deploy, run once:
```
npm run bootstrap:admin --workspace=server
```
with BOOTSTRAP_ADMIN_EMAIL/PASSWORD set.

## 6. Verify
- Health: https://your-backend/api/health
- Login, register, create org, etc.
- Check DB connected.
