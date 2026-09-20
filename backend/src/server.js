import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { getEnv } from './config/env.js';

const env = getEnv();

const startServer = async () => {
  await connectDatabase(env.mongodbUri);

  const server = app.listen(env.port, () => {
    console.log(`Claims API listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down.`);
    server.close(() => process.exit(0));
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error(`Unable to start the server: ${error.message}`);
  process.exit(1);
});
