import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const server = await createApp({
  config,
  logger: true,
});

await server.listen({
  host: '0.0.0.0',
  port: config.port,
});
