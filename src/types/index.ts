export interface Zone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface DashboardData {
  todayEarnings: number;
  currentEarningsPerHour: number;
  totalRides: number;
  avgRideValue: number;
  activeShift: { id: string; startTime: string } | null;
  bestRecommendation: {
    zone: string;
    distanceKm: number | null;
    travelTimeMinutes: number | null;
    expectedHourlyRevenue: number;
    score: number;
  } | null;
  zoneRankings: ZoneRanking[];
  bestHours: { hour: number; avgRevenue: number; rideCount: number }[];
  bestZones: { zoneId: string; zoneName: string; revenue: number; rideCount: number }[];
}

export interface ZoneRanking {
  zoneId: string;
  zoneName: string;
  score: number;
  expectedHourlyRevenue: number;
  distanceKm: number | null;
  travelTimeMinutes: number | null;
}

export interface RideLogEntry {
  id: string;
  date: string;
  fareAmount: number;
  durationMinutes: number | null;
  pickupZone: string;
  dropoffZone: string;
  status: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number | null;
  dropoffLng: number | null;
}

export interface AnalyticsData {
  revenueByHour: {
    hour: number;
    label: string;
    totalRevenue: number;
    avgRevenue: number;
    rideCount: number;
  }[];
  revenueByWeekday: {
    weekday: number;
    label: string;
    totalRevenue: number;
    avgRevenue: number;
    rideCount: number;
  }[];
  revenueByZone: {
    zone: string;
    totalRevenue: number;
    avgRevenue: number;
    rideCount: number;
  }[];
}

export interface HeatmapData {
  cells: {
    id: string;
    latitude: number;
    longitude: number;
    score: number;
    rideCount: number;
    revenue: number;
  }[];
  zones: Zone[];
  zoneScores: {
    zoneId: string;
    zoneName: string;
    score: number;
    rank: number;
  }[];
}

export interface Shift {
  id: string;
  driverId: string;
  startTime: string;
  endTime: string | null;
  totalRevenue: number;
}

export interface DriverPosition {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}
