import { Router } from 'express';
import { prisma } from '../db';
import { refreshRecommendations } from '../services/recommendationEngine';
import { getDefaultDriver, getActiveShift, getLatestPosition } from '../services/recommendationEngine';
import { CALARASI_ZONES } from '../zones';
import { getHeatmapCells } from '../services/heatmapService';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const recommendations = await prisma.zoneRecommendation.findMany({
      orderBy: { rank: 'asc' },
    });

    const best = recommendations[0];
    if (!best) {
      return res.json({ recommendation: null, zones: [] });
    }

    res.json({
      recommendation: {
        zone: best.zoneName,
        distanceKm: best.distanceKm,
        travelTimeMinutes: best.travelTimeMinutes,
        expectedHourlyRevenue: best.expectedHourlyRevenue,
        score: best.score,
      },
      zones: recommendations.map((r) => ({
        zoneId: r.zoneId,
        zoneName: r.zoneName,
        score: r.score,
        expectedHourlyRevenue: r.expectedHourlyRevenue,
        distanceKm: r.distanceKm,
        travelTimeMinutes: r.travelTimeMinutes,
        rank: r.rank,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

router.post('/refresh', async (_req, res) => {
  try {
    const driver = await getDefaultDriver();
    const shift = await getActiveShift(driver.id);
    let lat: number | undefined;
    let lng: number | undefined;

    if (shift) {
      const pos = await getLatestPosition(shift.id);
      if (pos) {
        lat = pos.latitude;
        lng = pos.longitude;
      }
    }

    const recommendations = await refreshRecommendations(lat, lng);
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to refresh recommendations' });
  }
});

router.get('/zones', (_req, res) => {
  res.json(CALARASI_ZONES);
});

router.get('/heatmap', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const cells = await getHeatmapCells(date);
    const zones = CALARASI_ZONES;

    const zoneScores = await prisma.zoneRecommendation.findMany({
      orderBy: { rank: 'asc' },
    });

    res.json({ cells, zones, zoneScores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load heatmap' });
  }
});

export default router;
