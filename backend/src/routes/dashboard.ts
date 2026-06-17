import { Router } from 'express';
import { prisma } from '../db';
import { getDefaultDriver, getActiveShift } from '../services/recommendationEngine';
import { CALARASI_ZONES } from '../zones';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const driver = await getDefaultDriver();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayShifts = await prisma.shift.findMany({
      where: {
        driverId: driver.id,
        startTime: { gte: todayStart },
      },
      include: { rides: true },
    });

    const todayRides = todayShifts.flatMap((s) => s.rides);
    const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.fareAmount), 0);

    const activeShift = await getActiveShift(driver.id);
    let currentEarningsPerHour = 0;

    if (activeShift) {
      const shiftRides = await prisma.ride.findMany({
        where: { shiftId: activeShift.id },
      });
      const shiftRevenue = shiftRides.reduce((sum, r) => sum + Number(r.fareAmount), 0);
      const hoursElapsed =
        (Date.now() - activeShift.startTime.getTime()) / (1000 * 60 * 60);
      currentEarningsPerHour = hoursElapsed > 0.1 ? shiftRevenue / hoursElapsed : 0;
    }

    const totalRides = todayRides.length;
    const avgRideValue = totalRides > 0 ? todayEarnings / totalRides : 0;

    const bestRecommendation = await prisma.zoneRecommendation.findFirst({
      where: { rank: 1 },
      orderBy: { calculatedAt: 'desc' },
    });

    const allRecommendations = await prisma.zoneRecommendation.findMany({
      orderBy: { rank: 'asc' },
      take: 9,
    });

    const rides = await prisma.ride.findMany({
      where: { completedAt: { not: null } },
      select: { completedAt: true, fareAmount: true },
    });

    const hourlyRevenue: Record<number, { total: number; count: number }> = {};
    for (let h = 0; h < 24; h++) hourlyRevenue[h] = { total: 0, count: 0 };

    for (const ride of rides) {
      if (!ride.completedAt) continue;
      const h = ride.completedAt.getHours();
      hourlyRevenue[h].total += Number(ride.fareAmount);
      hourlyRevenue[h].count += 1;
    }

    const bestHours = Object.entries(hourlyRevenue)
      .map(([hour, data]) => ({
        hour: parseInt(hour, 10),
        avgRevenue: data.count > 0 ? data.total / data.count : 0,
        rideCount: data.count,
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue);

    const zonePerformance = await Promise.all(
      CALARASI_ZONES.map(async (zone) => {
        const matchingRides = await prisma.ride.findMany({
          where: { completedAt: { not: null } },
          select: { pickupLat: true, pickupLng: true, fareAmount: true },
        });

        const filtered = matchingRides.filter((r) => {
          const d =
            Math.sqrt(
              (r.pickupLat - zone.latitude) ** 2 + (r.pickupLng - zone.longitude) ** 2
            ) * 111000;
          return d <= zone.radiusMeters;
        });

        const revenue = filtered.reduce((s, r) => s + Number(r.fareAmount), 0);
        return { zoneId: zone.id, zoneName: zone.name, revenue, rideCount: filtered.length };
      })
    );

    zonePerformance.sort((a, b) => b.revenue - a.revenue);

    res.json({
      todayEarnings,
      currentEarningsPerHour: Math.round(currentEarningsPerHour * 100) / 100,
      totalRides,
      avgRideValue: Math.round(avgRideValue * 100) / 100,
      activeShift: activeShift
        ? { id: activeShift.id, startTime: activeShift.startTime }
        : null,
      bestRecommendation: bestRecommendation
        ? {
            zone: bestRecommendation.zoneName,
            distanceKm: bestRecommendation.distanceKm,
            travelTimeMinutes: bestRecommendation.travelTimeMinutes,
            expectedHourlyRevenue: bestRecommendation.expectedHourlyRevenue,
            score: bestRecommendation.score,
          }
        : null,
      zoneRankings: allRecommendations.map((r) => ({
        zoneId: r.zoneId,
        zoneName: r.zoneName,
        score: r.score,
        expectedHourlyRevenue: r.expectedHourlyRevenue,
        distanceKm: r.distanceKm,
        travelTimeMinutes: r.travelTimeMinutes,
      })),
      bestHours,
      bestZones: zonePerformance.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
