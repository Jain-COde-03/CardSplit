import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  try {
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Graceful shutdown failed');
    process.exit(1);
  }
};

async function startServer() {
  try {
    await connectDatabase();
    logger.info('MongoDB connected successfully.');

    const server = app.listen(env.PORT, () => {
      logger.info(`CardBridge backend running on http://localhost:${env.PORT}`);
    });

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    server.on('close', async () => {
      await disconnectDatabase();
    });

    return server;
  } catch (error) {
    logger.error({ err: error }, `Failed to start the CardBridge backend: ${error.message}`);
    process.exit(1);
  }
}

startServer();

export default startServer;
