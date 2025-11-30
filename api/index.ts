import { app } from './src/server';

export default (req: any, res: any) => {
  // Vercel passes the full path, but Express needs it without /api prefix
  req.url = req.url.replace(/^\/api/, '') || '/';
  
  console.log('🚀 API called (index.ts):', req.url);
  
  return app(req, res);
};