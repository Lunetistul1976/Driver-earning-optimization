import { Router } from 'express';
import { prisma } from '../db';
import { CALARASI_ZONES } from '../zones';

const router = Router();

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

router.get('/', async (_req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { completedAt: { not: null } },
      select: {
        completedAt: true,
        fareAmount: true,
        pickupLat: true,
        pickupLng: true,
      },
    });

    const revenueByHour: Record<number, { total: number; count: number }> = {};
    for (let h = 0; h < 24; h++) revenueByHour[h] = { total: 0, count: 0 };

    const revenueByWeekday: Record<number, { total: number; count: number }> = {};
    for (let d = 0; d < 7; d++) revenueByWeekday[d] = { total: 0, count: 0 };

    const revenueByZone: Record<string, { total: number; count: number; name: string }> = {};
    for (const zone of CALARASI_ZONES) {
      revenueByZone[zone.id] = { total: 0, count: 0, name: zone.name };
    }

    for (const ride of rides) {
      if (!ride.completedAt) continue;
      const hour = ride.completedAt.getHours();
      const weekday = ride.completedAt.getDay();
      const fare = Number(ride.fareAmount);

      revenueByHour[hour].total += fare;
      revenueByHour[hour].count += 1;
      revenueByWeekday[weekday].total += fare;
      revenueByWeekday[weekday].count += 1;

      for (const zone of CALARASI_ZONES) {
        const dist =
          Math.sqrt(
            (ride.pickupLat - zone.latitude) ** 2 + (ride.pickupLng - zone.longitude) ** 2
          ) * 111000;
        if (dist <= zone.radiusMeters) {
          revenueByZone[zone.id].total += fare;
          revenueByZone[zone.id].count += 1;
          break;
        }
      }
    }

    res.json({
      revenueByHour: Object.entries(revenueByHour).map(([hour, data]) => ({
        hour: parseInt(hour, 10),
        label: `${hour.padStart(2, '0')}:00`,
        totalRevenue: data.total,
        avgRevenue: data.count > 0 ? data.total / data.count : 0,
        rideCount: data.count,
      })),
      revenueByWeekday: Object.entries(revenueByWeekday).map(([day, data]) => ({
        weekday: parseInt(day, 10),
        label: WEEKDAYS[parseInt(day, 10)],
        totalRevenue: data.total,
        avgRevenue: data.count > 0 ? data.total / data.count : 0,
        rideCount: data.count,
      })),
      revenueByZone: Object.values(revenueByZone)
        .map((z) => ({
          zone: z.name,
          totalRevenue: z.total,
          avgRevenue: z.count > 0 ? z.total / z.count : 0,
          rideCount: z.count,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
