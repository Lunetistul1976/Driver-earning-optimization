import { prisma } from '../db';
import { CALARASI_ZONES } from '../zones';

const DEFAULT_DRIVER_NAME = 'Driver';

export async function getDefaultDriver() {
  let driver = await prisma.driver.findFirst();
  if (!driver) {
    driver = await prisma.driver.create({
      data: { name: DEFAULT_DRIVER_NAME },
    });
  }
  return driver;
}

export async function getActiveShift(driverId: string) {
  return prisma.shift.findFirst({
    where: { driverId, endTime: null },
    orderBy: { startTime: 'desc' },
  });
}

export async function getLatestPosition(shiftId: string) {
  return prisma.driverPosition.findFirst({
    where: { shiftId },
    orderBy: { timestamp: 'desc' },
  });
}

export async function getLatestWeather() {
  return prisma.weatherSnapshot.findFirst({
    orderBy: { timestamp: 'desc' },
  });
}

export function computeWeatherBonus(
  temperature: number,
  rain: number,
  windSpeed: number
): number {
  let bonus = 2;
  if (rain > 0.5) bonus += 3;
  if (temperature < 5 || temperature > 32) bonus += 1;
  if (windSpeed > 30) bonus -= 1;
  return Math.max(0, bonus);
}

export async function getHistoricalHourlyRevenueByZone(
  zoneId: string,
  hour: number
): Promise<number> {
  const rides = await prisma.ride.findMany({
    where: {
      completedAt: { not: null },
      pickupLat: { not: 0 },
    },
    select: {
      fareAmount: true,
      completedAt: true,
      pickupLat: true,
      pickupLng: true,
    },
  });

  const zone = CALARASI_ZONES.find((z) => z.id === zoneId);
  if (!zone) return 0;

  const zoneRides = rides.filter((ride) => {
    if (!ride.completedAt) return false;
    const rideHour = ride.completedAt.getHours();
    if (rideHour !== hour) return false;
    const dist =
      Math.sqrt(
        (ride.pickupLat - zone.latitude) ** 2 + (ride.pickupLng - zone.longitude) ** 2
      ) * 111000;
    return dist <= zone.radiusMeters;
  });

  if (zoneRides.length === 0) return 0;

  const totalRevenue = zoneRides.reduce((sum, r) => sum + Number(r.fareAmount), 0);
  const uniqueHours = new Set(
    zoneRides.map((r) => r.completedAt!.toISOString().slice(0, 13))
  ).size;

  return uniqueHours > 0 ? totalRevenue / uniqueHours : 0;
}

export async function getRecentRideCountByZone(zoneId: string, hoursBack = 2): Promise<number> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const zone = CALARASI_ZONES.find((z) => z.id === zoneId);
  if (!zone) return 0;

  const rides = await prisma.ride.findMany({
    where: { acceptedAt: { gte: since } },
    select: { pickupLat: true, pickupLng: true },
  });

  return rides.filter((ride) => {
    const dist =
      Math.sqrt(
        (ride.pickupLat - zone.latitude) ** 2 + (ride.pickupLng - zone.longitude) ** 2
      ) * 111000;
    return dist <= zone.radiusMeters;
  }).length;
}

export interface ZoneScore {
  zoneId: string;
  zoneName: string;
  score: number;
  expectedHourlyRevenue: number;
  historicalHourlyRevenue: number;
  recentRideCount: number;
  weatherBonus: number;
}

export async function calculateZoneScores(hour?: number): Promise<ZoneScore[]> {
  const currentHour = hour ?? new Date().getHours();
  const weather = await getLatestWeather();
  const weatherBonus = weather
    ? computeWeatherBonus(weather.temperature, weather.rain, weather.windSpeed)
    : 2;

  const scores: ZoneScore[] = [];

  for (const zone of CALARASI_ZONES) {
    const historicalHourlyRevenue = await getHistoricalHourlyRevenueByZone(
      zone.id,
      currentHour
    );
    const recentRideCount = await getRecentRideCountByZone(zone.id);

    const score =
      historicalHourlyRevenue * 0.7 + recentRideCount * 0.2 + weatherBonus * 0.1;

    scores.push({
      zoneId: zone.id,
      zoneName: zone.name,
      score,
      expectedHourlyRevenue: historicalHourlyRevenue || recentRideCount * 15,
      historicalHourlyRevenue,
      recentRideCount,
      weatherBonus,
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}

export async function refreshRecommendations(
  driverLat?: number,
  driverLng?: number
) {
  const scores = await calculateZoneScores();

  await prisma.zoneRecommendation.deleteMany({});

  const recommendations = await Promise.all(
    scores.map(async (s, index) => {
      let distanceKm: number | null = null;
      let travelTimeMinutes: number | null = null;

      if (driverLat != null && driverLng != null) {
        const zone = CALARASI_ZONES.find((z) => z.id === s.zoneId)!;
        const route = await import('./routingService').then((m) =>
          m.getRouteInfo(driverLat, driverLng, zone.latitude, zone.longitude)
        );
        distanceKm = route.distanceKm;
        travelTimeMinutes = route.travelTimeMinutes;
      }

      return prisma.zoneRecommendation.create({
        data: {
          zoneId: s.zoneId,
          zoneName: s.zoneName,
          score: s.score,
          expectedHourlyRevenue: s.expectedHourlyRevenue,
          distanceKm,
          travelTimeMinutes,
          rank: index + 1,
        },
      });
    })
  );

  return recommendations;
}
