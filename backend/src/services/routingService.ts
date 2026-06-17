import { haversineDistanceKm } from '../zones';

export interface RouteInfo {
  distanceKm: number;
  travelTimeMinutes: number;
}

export async function getRouteInfo(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteInfo> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [fromLng, fromLat],
              [toLng, toLat],
            ],
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          routes: Array<{
            summary: { distance: number; duration: number };
          }>;
        };
        const route = data.routes[0];
        if (route) {
          return {
            distanceKm: route.summary.distance / 1000,
            travelTimeMinutes: route.summary.duration / 60,
          };
        }
      }
    } catch {
      // fall through to estimate
    }
  }

  const distanceKm = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
  const travelTimeMinutes = (distanceKm / 30) * 60;

  return { distanceKm, travelTimeMinutes };
}
