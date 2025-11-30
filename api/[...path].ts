import { app } from './src/server';

export default (req: any, res: any) => {
  
  req.url = req.url.replace(/^\/api/, '') || '/';
  
  console.log('🚀 API called (index.ts):', req.url);
  
  return app(req, res);
};