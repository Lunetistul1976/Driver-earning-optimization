import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dashboardRouter from './routes/dashboard';
import shiftsRouter from './routes/shifts';
import ridesRouter from './routes/rides';
import analyticsRouter from './routes/analytics';
import recommendationsRouter from './routes/recommendations';
import positionsRouter from './routes/positions';
import { startScheduler } from './jobs/scheduler';
import { syncWeather } from './services/weatherService';
import { refreshRecommendations } from './services/recommendationEngine';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/positions', positionsRouter);

async function bootstrap() {
  try {
    await syncWeather();
    await refreshRecommendations();
    startScheduler();
  } catch (err) {
    console.warn('Bootstrap warning (DB may not be ready):', err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
