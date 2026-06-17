export interface ZoneDefinition {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const CALARASI_ZONES: ZoneDefinition[] = [
  {
    id: 'city-center',
    name: 'City Center',
    latitude: 44.1961,
    longitude: 27.3318,
    radiusMeters: 800,
  },
  {
    id: 'train-station',
    name: 'Train Station',
    latitude: 44.203,
    longitude: 27.318,
    radiusMeters: 600,
  },
  {
    id: 'hospital',
    name: 'Hospital',
    latitude: 44.198,
    longitude: 27.34,
    radiusMeters: 500,
  },
  {
    id: 'market-area',
    name: 'Market Area',
    latitude: 44.195,
    longitude: 27.328,
    radiusMeters: 700,
  },
  {
    id: 'industrial-area',
    name: 'Industrial Area',
    latitude: 44.188,
    longitude: 27.35,
    radiusMeters: 1000,
  },
  {
    id: 'west-residential',
    name: 'West Residential',
    latitude: 44.2,
    longitude: 27.31,
    radiusMeters: 900,
  },
  {
    id: 'east-residential',
    name: 'East Residential',
    latitude: 44.195,
    longitude: 27.355,
    radiusMeters: 900,
  },
  {
    id: 'south-residential',
    name: 'South Residential',
    latitude: 44.185,
    longitude: 27.33,
    radiusMeters: 900,
  },
  {
    id: 'north-residential',
    name: 'North Residential',
    latitude: 44.21,
    longitude: 27.335,
    radiusMeters: 900,
  },
];

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findZoneForPoint(
  lat: number,
  lng: number,
  zones: ZoneDefinition[] = CALARASI_ZONES
): ZoneDefinition | null {
  for (const zone of zones) {
    const distMeters = haversineDistanceKm(lat, lng, zone.latitude, zone.longitude) * 1000;
    if (distMeters <= zone.radiusMeters) {
      return zone;
    }
  }
  return null;
}
