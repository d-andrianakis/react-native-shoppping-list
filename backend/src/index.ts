import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { testConnection, closeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit';
import { initializeSocket, getIO } from './socket';

// Import routes
import authRoutes from './routes/auth.routes';
import listsRoutes from './routes/lists.routes';
import itemsRoutes from './routes/items.routes';
import membersRoutes from './routes/members.routes';
import suggestionsRoutes from './routes/suggestions.routes';

const app: Application = express();
const httpServer = createServer(app);

// Trust proxy (Coolify/Traefik sits in front)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to API routes
app.use('/api', apiRateLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/lists/:listId/items', itemsRoutes);
app.use('/api/lists/:listId/members', membersRoutes);
app.use('/api/suggestions', suggestionsRoutes);

// Add leave list route (special case not nested under members)
import { Router } from 'express';
import { authenticateToken } from './middleware/auth';
import * as membersController from './controllers/membersController';

const leaveRouter = Router();
leaveRouter.post('/api/lists/:listId/leave', authenticateToken, membersController.leaveList);
app.use(leaveRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start listening
    httpServer.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛒  Shopping List API Server                           ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(42)}║
║   Port:        ${env.PORT.toString().padEnd(42)}║
║   Database:    ${env.DB_NAME.padEnd(42)}║
║                                                           ║
║   📚 API Endpoints:                                       ║
║   - POST   /api/auth/register                            ║
║   - POST   /api/auth/login                               ║
║   - GET    /api/auth/me                                  ║
║   - GET    /api/lists                                    ║
║   - POST   /api/lists                                    ║
║   - GET    /api/lists/:id/items                          ║
║   - POST   /api/lists/:id/items                          ║
║   - GET    /api/suggestions?q=                           ║
║                                                           ║
║   ✅ Server ready to accept connections                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  try { getIO().close(); } catch (_) {}
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  try { getIO().close(); } catch (_) {}
  await closeDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
