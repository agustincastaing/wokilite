import { app } from './src/server'

export default app;

export const config = {
  api: {
    bodyParser: false, // Express already handles JSON
  },
};
