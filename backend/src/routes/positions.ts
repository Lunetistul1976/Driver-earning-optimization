import { Router } from 'express';
import { prisma } from '../db';
import { getDefaultDriver, getActiveShift } from '../services/recommendationEngine';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const driver = await getDefaultDriver();
    const shift = await getActiveShift(driver.id);

    if (!shift) {
      return res.status(400).json({ error: 'No active shift' });
    }

    const { latitude, longitude, speed } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }

    const position = await prisma.driverPosition.create({
      data: {
        shiftId: shift.id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: speed != null ? Number(speed) : null,
      },
    });

    res.json(position);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record position' });
  }
});

router.get('/latest', async (_req, res) => {
  try {
    const driver = await getDefaultDriver();
    const shift = await getActiveShift(driver.id);

    if (!shift) {
      return res.json(null);
    }

    const position = await prisma.driverPosition.findFirst({
      where: { shiftId: shift.id },
      orderBy: { timestamp: 'desc' },
    });

    res.json(position);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get position' });
  }
});

export default router;
