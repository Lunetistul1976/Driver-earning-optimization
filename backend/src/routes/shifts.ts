import { Router } from 'express';
import { prisma } from '../db';
import { getDefaultDriver, getActiveShift } from '../services/recommendationEngine';

const router = Router();

router.post('/start', async (_req, res) => {
  try {
    const driver = await getDefaultDriver();
    const existing = await getActiveShift(driver.id);

    if (existing) {
      return res.status(400).json({ error: 'Shift already active', shift: existing });
    }

    const shift = await prisma.shift.create({
      data: {
        driverId: driver.id,
        startTime: new Date(),
      },
    });

    res.json(shift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start shift' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: { rides: true },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.endTime) {
      return res.status(400).json({ error: 'Shift already ended' });
    }

    const totalRevenue = shift.rides.reduce((sum, r) => sum + Number(r.fareAmount), 0);

    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: {
        endTime: new Date(),
        totalRevenue,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to end shift' });
  }
});

router.get('/active', async (_req, res) => {
  try {
    const driver = await getDefaultDriver();
    const shift = await getActiveShift(driver.id);
    res.json(shift);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get active shift' });
  }
});

export default router;
