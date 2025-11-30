// api/index.ts
import { createServer } from 'node:http';
import { app } from './src/server';

// Vercel needs a raw Node.js handler, not the Express app directly
const server = createServer(app);

export default server;