import { app } from './src/server.ts'

export default app;

export const config = {
  api: {
    bodyParser: false, // Express already handles JSON
  },
};
