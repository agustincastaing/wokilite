import { app } from './src/server'

console.log('🚀 API route handler loaded (api.ts)');

export default app;

export const config = {
  api: {
    bodyParser: false, // Express already handles JSON
  },
};
