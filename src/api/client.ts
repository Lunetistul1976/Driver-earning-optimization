const API_BASE = process.env.REACT_APP_API_URL || '/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  getDashboard: () => fetchJson<import('../types').DashboardData>('/dashboard'),
  getRides: () => fetchJson<import('../types').RideLogEntry[]>('/rides'),
  getAnalytics: () => fetchJson<import('../types').AnalyticsData>('/analytics'),
  getHeatmap: (date?: string) =>
    fetchJson<import('../types').HeatmapData>(
      `/recommendations/heatmap${date ? `?date=${date}` : ''}`
    ),
  getActiveShift: () => fetchJson<import('../types').Shift | null>('/shifts/active'),
  startShift: () =>
    fetchJson<import('../types').Shift>('/shifts/start', { method: 'POST' }),
  endShift: (id: string) =>
    fetchJson<import('../types').Shift>(`/shifts/${id}/end`, { method: 'POST' }),
  acceptRide: (pickupLat: number, pickupLng: number) =>
    fetchJson<{ id: string }>('/rides/accept', {
      method: 'POST',
      body: JSON.stringify({ pickupLat, pickupLng }),
    }),
  completeRide: (
    id: string,
    fareAmount: number,
    dropoffLat?: number,
    dropoffLng?: number
  ) =>
    fetchJson<unknown>(`/rides/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ fareAmount, dropoffLat, dropoffLng }),
    }),
  recordPosition: (latitude: number, longitude: number, speed?: number) =>
    fetchJson<unknown>('/positions', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, speed }),
    }),
  getLatestPosition: () =>
    fetchJson<import('../types').DriverPosition | null>('/positions/latest'),
  refreshRecommendations: () =>
    fetchJson<unknown>('/recommendations/refresh', { method: 'POST' }),
};
