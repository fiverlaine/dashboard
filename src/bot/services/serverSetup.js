import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

export default class ServerSetup {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      ...SERVER_CONFIG.socket,
      cors: SERVER_CONFIG.cors
    });
  }

  setupMiddleware(channelMonitor, memberTracker) {
    // Enable CORS
    this.app.use(cors(SERVER_CONFIG.cors));
    
    // Parse JSON bodies
    this.app.use(express.json());

    // Set proper content type for API responses
    this.app.use('/api', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Add request context
    this.app.use((req, res, next) => {
      req.io = this.io;
      req.channelMonitor = channelMonitor;
      req.memberTracker = memberTracker;
      next();
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      logger.error('Server error:', err);
      
      if (req.path.startsWith('/api')) {
        res.status(err.status || 500).json({
          success: false,
          error: err.message || 'Internal server error'
        });
      } else {
        next(err);
      }
    });
  }

  setupHealthCheck(bot) {
    this.app.get('/health', (req, res) => {
      res.json({ 
        success: true,
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        botConnected: bot.isPolling(),
        socketConnected: this.io.engine.clientsCount > 0
      });
    });
  }

  setupRoutes(apiRoutes) {
    // API routes
    this.app.use('/api', apiRoutes);

    const distPath = path.join(projectRoot, 'dist');

    // Serve static files
    this.app.use(express.static(distPath));

    // SPA fallback
    this.app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, err => {
        if (err) {
          logger.error('Error serving index.html:', err);
          res.status(500).json({
            success: false,
            error: 'Error loading application'
          });
        }
      });
    });

    logger.info(`Static files path: ${distPath}`);
  }

  start() {
    const port = SERVER_CONFIG.port;
    this.server.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  }
}