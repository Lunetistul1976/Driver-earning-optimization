import { prisma } from '../db';
import { findZoneForPoint } from '../zones';

const CELL_SIZE = 0.005;

function snapToCell(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat / CELL_SIZE) * CELL_SIZE,
    lng: Math.round(lng / CELL_SIZE) * CELL_SIZE,
  };
}

export async function generateHeatmap(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  const rides = await prisma.ride.findMany({
    where: {
      completedAt: { gte: yesterday, lt: today },
    },
    select: {
      pickupLat: true,
      pickupLng: true,
      fareAmount: true,
    },
  });

  const cellMap = new Map<
    string,
    { lat: number; lng: number; revenue: number; rideCount: number }
  >();

  for (const ride of rides) {
    const cell = snapToCell(ride.pickupLat, ride.pickupLng);
    const key = `${cell.lat},${cell.lng}`;
    const existing = cellMap.get(key) ?? {
      lat: cell.lat,
      lng: cell.lng,
      revenue: 0,
      rideCount: 0,
    };
    existing.revenue += Number(ride.fareAmount);
    existing.rideCount += 1;
    cellMap.set(key, existing);
  }

  const maxRevenue = Math.max(...Array.from(cellMap.values()).map((c) => c.revenue), 1);

  await prisma.heatmapCell.deleteMany({ where: { date: yesterday } });

  for (const cell of cellMap.values()) {
    const zone = findZoneForPoint(cell.lat, cell.lng);
    const zoneBonus = zone ? 0.2 : 0;
    const score = (cell.revenue / maxRevenue) * 0.8 + zoneBonus;

    await prisma.heatmapCell.create({
      data: {
        latitude: cell.lat,
        longitude: cell.lng,
        score,
        rideCount: cell.rideCount,
        revenue: cell.revenue,
        date: yesterday,
      },
    });
  }
}

export async function getHeatmapCells(date?: string) {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  let cells = await prisma.heatmapCell.findMany({
    where: { date: targetDate },
  });

  if (cells.length === 0) {
    cells = await prisma.heatmapCell.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  return cells;
}
