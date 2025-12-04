import express, { Request, Response, NextFunction } from 'express';
import { DataRepository } from './services/DataRepository';
import { createWarbandRouter } from './routes/warbandRoutes';
import path from 'path';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// CORS middleware for frontend communication
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Initialize data repository
const dataRepository = new DataRepository(
  path.join(process.cwd(), 'data', 'warbands.json'),
  true
);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Mount warband routes
const warbandRouter = createWarbandRouter(dataRepository);
app.use('/api', warbandRouter);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    details: 'The requested resource does not exist'
  });
});

// Start server
async function startServer() {
  try {
    // Load data from file on startup
    await dataRepository.loadFromFile();
    console.log('Warband data loaded successfully');

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log('API endpoints available at:');
      console.log('  POST   /api/warbands');
      console.log('  GET    /api/warbands');
      console.log('  GET    /api/warbands/:id');
      console.log('  PUT    /api/warbands/:id');
      console.log('  DELETE /api/warbands/:id');
      console.log('  POST   /api/warbands/:id/weirdos');
      console.log('  PUT    /api/warbands/:id/weirdos/:weirdoId');
      console.log('  DELETE /api/warbands/:id/weirdos/:weirdoId');
      console.log('  POST   /api/calculate-cost');
      console.log('  POST   /api/validate');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
