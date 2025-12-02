import express, { Request, Response } from 'express';
import cors from 'cors';
import { pino } from 'pino';
import { prisma } from './db/client';

// Routes
import restaurantRouter from './routes/restaurants';
import availabilityRouter from './routes/availability';
import reservationRouter from './routes/reservations';

const logger = pino({ level: 'info' });

const app = express();

console.log('Express app initialized');

app.use(express.json());

app.use(cors({
  origin: [
    'https://wokilite.vercel.app',
    'http://localhost:5173',
    process.env.FRONTEND_URL || '*'
  ]
}));

app.get('/health', async (_req: Request, res: Response) => {
  console.log('💚 Health check called');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/restaurants', restaurantRouter);
app.use('/availability', availabilityRouter);
app.use('/reservations', reservationRouter);

const PORT = process.env.PORT || 3000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  prisma.$connect().then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((error: any) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;