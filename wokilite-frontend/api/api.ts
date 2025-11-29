import { app } from './wokilite/src/server.js'

export default app;

export const config = {
  api: {
    bodyParser: false, // Express already handles JSON
  },
};
