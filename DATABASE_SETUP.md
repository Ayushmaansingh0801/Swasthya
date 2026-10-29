# DATABASE_SETUP.md

## MongoDB Atlas (recommended for production)
1. Create cluster + database user.
2. Set `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/swasthya?retryWrites=true&w=majority`
3. Never commit .env.

## Local dev
- Leave `MONGODB_URI` empty → auto-starts MongoMemoryServer (if available).
- Or run local mongod and set `MONGODB_URI=mongodb://127.0.0.1:27017/swasthya`.

## Migrations / seed
- Dev: `npm run seed --workspace=server` (clears + reseeds)
- Prod: `SEED_ON_START=false`; use bootstrap admin CLI.
- Destructive reset requires `SEED_RESET=true` (dev only).

## Backups
- Atlas automated backups (paid tiers) or mongodump cron.
