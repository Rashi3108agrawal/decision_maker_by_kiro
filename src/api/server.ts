import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { optionsRouter } from './routes/options';
import { criteriaRouter } from './routes/criteria';
import { analysisRouter } from './routes/analysis';
import { templatesRouter } from './routes/templates';
import { validationRouter } from './routes/validation';
import { exportRouter } from './routes/export';
import { sessionsRouter } from './routes/sessions';
import { errorHandler } from './middleware/errorHandler';
import { validateRequest } from './middleware/validation';

export function createServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Logging middleware
  app.use(morgan('combined'));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // API routes
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/options', optionsRouter);
  app.use('/api/criteria', criteriaRouter);
  app.use('/api/analysis', analysisRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/validation', validationRouter);
  app.use('/api/export', exportRouter);

  // Serve React app static files
  const uiBuildPath = path.join(__dirname, '../../ui/build');
  app.use(express.static(uiBuildPath));

  // Serve React app for all non-API routes (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      // Don't serve React app for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Route ${req.method} ${req.originalUrl} not found`,
          timestamp: new Date().toISOString()
        });
      }
      
      res.sendFile(path.join(uiBuildPath, 'index.html'));
    });
  } else {
    // In development/test, just return 404 for unknown routes
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Global error handler
  app.use(errorHandler);

  return app;
}

export function startServer(port: number = 3000) {
  const app = createServer();
  
  const server = app.listen(port, () => {
    console.log(`Decision Helper API server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  return server;
}