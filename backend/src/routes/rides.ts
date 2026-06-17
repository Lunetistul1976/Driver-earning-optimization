import { Router } from 'express';
import { prisma } from '../db';
import { getDefaultDriver, getActiveShift } from '../services/recommendationEngine';
import { findZoneForPoint } from '../zones';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      orderBy: { acceptedAt: 'desc' },
      take: 100,
      include: { shift: true },
    });

    const enriched = rides.map((ride) => ({
      id: ride.id,
      date: ride.acceptedAt,
      fareAmount: Number(ride.fareAmount),
      durationMinutes: ride.durationMinutes,
      pickupZone: findZoneForPoint(ride.pickupLat, ride.pickupLng)?.name ?? 'Unknown',
      dropoffZone:
        ride.dropoffLat && ride.dropoffLng
          ? findZoneForPoint(ride.dropoffLat, ride.dropoffLng)?.name ?? 'Unknown'
          : '—',
      status: ride.completedAt ? 'completed' : 'accepted',
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load rides' });
  }
});

router.post('/accept', async (req, res) => {
  try {
    const driver = await getDefaultDriver();
    let shift = await getActiveShift(driver.id);

    if (!shift) {
      shift = await prisma.shift.create({
        data: { driverId: driver.id, startTime: new Date() },
      });
    }

    const { pickupLat, pickupLng } = req.body;
    if (pickupLat == null || pickupLng == null) {
      return res.status(400).json({ error: 'pickupLat and pickupLng required' });
    }

    const ride = await prisma.ride.create({
      data: {
        shiftId: shift.id,
        acceptedAt: new Date(),
        pickupLat: Number(pickupLat),
        pickupLng: Number(pickupLng),
        dropoffLat: 0,
        dropoffLng: 0,
        fareAmount: 0,
      },
    });

    res.json(ride);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { fareAmount, dropoffLat, dropoffLng } = req.body;

    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const completedAt = new Date();
    const durationMinutes = Math.round(
      (completedAt.getTime() - ride.acceptedAt.getTime()) / (1000 * 60)
    );

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        completedAt,
        fareAmount: Number(fareAmount) || 0,
        dropoffLat: dropoffLat != null ? Number(dropoffLat) : ride.dropoffLat,
        dropoffLng: dropoffLng != null ? Number(dropoffLng) : ride.dropoffLng,
        durationMinutes,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

export default router;
