import express, { Request, Response } from 'express';
import { pino } from 'pino';
import { seedData } from './data';
import availabilityRouter from './routes/availability';
import reservationRouter from './routes/reservations';
import restaurantRouter from './routes/restaurants';
import cors from 'cors';

const logger = pino({ level: 'info' });

const app = express();
app.use(express.json());
seedData();

app.use(cors({
  origin: ['https://wokilite.vercel.app', 'http://localhost:5173']
}));

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/restaurants', restaurantRouter);
app.use('/availability', availabilityRouter);
app.use('/reservations', reservationRouter);

// ❗ REMOVE app.listen() — Vercel will handle it
export { app };
