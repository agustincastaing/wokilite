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
app.use(cors({ origin: 'http://localhost:5173' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});


app.use('/restaurants', restaurantRouter);
app.use('/availability', availabilityRouter);
app.use('/reservations', reservationRouter);

const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info('Routes registered: /health, /availability, /reservations, /restaurants');
});

export { app };