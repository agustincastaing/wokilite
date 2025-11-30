import { app } from './src/server'

console.log('🚀 API route handler loaded (index.ts)');

export default app;

export const config = {
  api: {
    bodyParser: false, // Express already handles JSON
  },
};
