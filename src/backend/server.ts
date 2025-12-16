import express, { Request, Response, NextFunction } from 'express';
import { DataRepository } from './services/DataRepository.js';
import { ReadmeContentService } from './services/ReadmeContentService.js';
import { createWarbandRouter } from './routes/warbandRoutes.js';
import { createImportExportRouter } from './routes/importExportRoutes.js';
import { isError } from './utils/typeGuards.js';
import { ConfigurationManager } from './config/ConfigurationManager.js';
import { ConfigurationFactory } from './config/ConfigurationFactory.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start server
async function startServer() {
  try {
    // Initialize configuration manager first
    console.log('Initializing configuration...');
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();

    // Get configuration
    const serverConfig = configManager.getServerConfig();
    const environmentConfig = configManager.getEnvironmentConfig();

    // Initialize configuration factory and cost engine
    const configFactory = new ConfigurationFactory(configManager);
    const costEngine = configFactory.createCostEngine();

    // Initialize data repository using centralized configuration
    const dataRepository = new DataRepository(
      serverConfig.warbandDataPath,
      serverConfig.enableAutoSave,
      costEngine
    );

    const app = express();

    // Middleware
    app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit for import operations

    // CORS middleware for frontend communication using centralized configuration
    app.use((_req, res, next) => {
      const corsOrigins = serverConfig.corsOrigins.join(', ');
      res.header('Access-Control-Allow-Origin', corsOrigins);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition');
      next();
    });

    // Serve static data files using centralized configuration
    app.use('/data', express.static(path.join(process.cwd(), serverConfig.dataPath)));

    // Health check endpoint
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // Mount warband routes
    const warbandRouter = createWarbandRouter(dataRepository);
    app.use('/api', warbandRouter);

    // Mount import/export routes
    const importExportRouter = createImportExportRouter(dataRepository);
    app.use('/api', importExportRouter);

    // Serve static files in production using centralized configuration
    if (environmentConfig.isProduction) {
      const frontendPath = path.join(__dirname, '..', 'frontend');
      app.use(express.static(frontendPath));
      
      // Serve index.html for all non-API routes (SPA support)
      app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    }

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

    // Load data from file on startup
    await dataRepository.loadFromFile();
    console.log('Warband data loaded successfully');

    // Initialize README content service
    const readmeContentService = ReadmeContentService.getInstance();
    await readmeContentService.initialize();

    const PORT = serverConfig.port;

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log('API endpoints available at:');
      console.log('  GET    /api/readme-content');
      console.log('  POST   /api/warbands');
      console.log('  GET    /api/warbands');
      console.log('  GET    /api/warbands/:id');
      console.log('  PUT    /api/warbands/:id');
      console.log('  DELETE /api/warbands/:id');
      console.log('  POST   /api/warbands/:id/weirdos');
      console.log('  PUT    /api/warbands/:id/weirdos/:weirdoId');
      console.log('  DELETE /api/warbands/:id/weirdos/:weirdoId');
      console.log('  GET    /api/warbands/:id/export');
      console.log('  POST   /api/warbands/import');
      console.log('  POST   /api/warbands/validate-import');
      console.log('  GET    /api/game-data/attributes');
      console.log('  GET    /api/game-data/weapons/close');
      console.log('  GET    /api/game-data/weapons/ranged');
      console.log('  GET    /api/game-data/equipment');
      console.log('  GET    /api/game-data/psychic-powers');
      console.log('  GET    /api/game-data/leader-traits');
      console.log('  GET    /api/game-data/warband-abilities');
      console.log('  POST   /api/cost/calculate');
      console.log('  POST   /api/validation/warband');
      console.log('  POST   /api/validation/weirdo');
      console.log('  POST   /api/calculate-cost');
      console.log('  POST   /api/validate');
    });
  } catch (error: unknown) {
    if (isError(error)) {
      console.error('Failed to start server:', error.message);
    } else {
      console.error('Failed to start server:', String(error));
    }
    process.exit(1);
  }
}

startServer();
