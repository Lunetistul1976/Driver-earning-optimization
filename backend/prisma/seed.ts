import { PrismaClient } from '@prisma/client';
import { CALARASI_ZONES } from '../src/zones';

const prisma = new PrismaClient();

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomZone() {
  return CALARASI_ZONES[Math.floor(Math.random() * CALARASI_ZONES.length)];
}

function pointInZone(zone: (typeof CALARASI_ZONES)[0]) {
  const offsetLat = (Math.random() - 0.5) * (zone.radiusMeters / 111000) * 1.5;
  const offsetLng = (Math.random() - 0.5) * (zone.radiusMeters / 111000) * 1.5;
  return {
    lat: zone.latitude + offsetLat,
    lng: zone.longitude + offsetLng,
  };
}

async function main() {
  console.log('Seeding database...');

  for (const zone of CALARASI_ZONES) {
    await prisma.zone.upsert({
      where: { id: zone.id },
      update: zone,
      create: zone,
    });
  }

  const driver = await prisma.driver.upsert({
    where: { id: 'default-driver' },
    update: {},
    create: { id: 'default-driver', name: 'Driver' },
  });

  const existingRides = await prisma.ride.count();
  if (existingRides === 0) {
    const now = new Date();
    const shift = await prisma.shift.create({
      data: {
        driverId: driver.id,
        startTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        totalRevenue: 0,
      },
    });

    let totalRevenue = 0;
    for (let day = 14; day >= 0; day--) {
      const ridesPerDay = 8 + Math.floor(Math.random() * 12);
      for (let i = 0; i < ridesPerDay; i++) {
        const pickupZone = randomZone();
        const dropoffZone = randomZone();
        const pickup = pointInZone(pickupZone);
        const dropoff = pointInZone(dropoffZone);

        const dayDate = new Date(now);
        dayDate.setDate(dayDate.getDate() - day);
        const hour = 6 + Math.floor(Math.random() * 16);
        dayDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

        const duration = 5 + Math.floor(Math.random() * 25);
        const fare = Math.round(randomInRange(12, 45) * 100) / 100;
        totalRevenue += fare;

        await prisma.ride.create({
          data: {
            shiftId: shift.id,
            acceptedAt: dayDate,
            completedAt: new Date(dayDate.getTime() + duration * 60 * 1000),
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            fareAmount: fare,
            durationMinutes: duration,
          },
        });
      }
    }

    await prisma.shift.update({
      where: { id: shift.id },
      data: { totalRevenue },
    });
  }

  await prisma.weatherSnapshot.create({
    data: {
      temperature: 22,
      rain: 0,
      windSpeed: 8,
    },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
