import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  try {
    console.log('--- Initializing Swasthya AI Backend API ---');
    await connectDB();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[Swasthya AI] Server running successfully on http://localhost:${env.PORT}`);
      console.log(`[Swasthya AI] REST API endpoints available under http://localhost:${env.PORT}/api/v1`);
      console.log(`[Swasthya AI] Health check: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n[Swasthya AI] Gracefully shutting down...');
      server.close();
      process.exit(0);
    });
  } catch (err: any) {
    console.error('[Swasthya AI] Fatal startup failure:', err.message);
    process.exit(1);
  }
}

bootstrap();
