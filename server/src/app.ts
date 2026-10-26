import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import doctorRoutes from './routes/doctors';
import appointmentRoutes from './routes/appointments';
import bedRoutes from './routes/beds';
import recordRoutes from './routes/records';
import prescriptionRoutes from './routes/prescriptions';
import inventoryRoutes from './routes/inventory';
import labOrderRoutes from './routes/labOrders';
import aiRoutes from './routes/ai';
import verificationRoutes from './routes/verification';
import supportRoutes from './routes/support';
import auditRoutes from './routes/audit';
import analyticsRoutes from './routes/analytics';

export function createApp(): Application {
  const app = express();

  // Security and utilities
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  app.use(
    cors({
      origin: [env.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'Swasthya AI Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      aiProvider: env.AI_PROVIDER,
    });
  });

  // API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/organizations', organizationRoutes);
  apiV1.use('/doctors', doctorRoutes);
  apiV1.use('/appointments', appointmentRoutes);
  apiV1.use('/beds', bedRoutes);
  apiV1.use('/records', recordRoutes);
  apiV1.use('/prescriptions', prescriptionRoutes);
  apiV1.use('/inventory', inventoryRoutes);
  apiV1.use('/lab-orders', labOrderRoutes);
  apiV1.use('/ai', aiRoutes);
  apiV1.use('/verification', verificationRoutes);
  apiV1.use('/support', supportRoutes);
  apiV1.use('/audit-logs', auditRoutes);
  apiV1.use('/analytics', analyticsRoutes);

  app.use('/api/v1', apiV1);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
