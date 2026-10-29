# DEPLOYMENT_ARCHITECTURE.md

```
[User Browser / Mobile]
        |
        v
[Vercel / Cloudflare Pages]  <-- React/Vite build (client/dist)
        |
        | HTTPS /api
        v
[Render / Railway / Fly.io]  <-- Express API (server)
        |
        +--> [MongoDB Atlas] (persistent data)
        +--> [Redis] (optional rate limiting)
        +--> [Socket.IO] (realtime, same host)
        +--> [File storage] (S3 or local volume)
```

## Notes
- Frontend proxies /api to backend in dev; in prod set VITE_API_BASE or use same origin.
- Socket.IO shares backend port (5000).
- Uploads: use cloud storage (S3) in production; local disk is ephemeral on many hosts.
