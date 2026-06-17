import cron from 'node-cron';
import { syncWeather } from '../services/weatherService';
import {
  refreshRecommendations,
  getDefaultDriver,
  getActiveShift,
  getLatestPosition,
} from '../services/recommendationEngine';
import { generateHeatmap } from '../services/heatmapService';

export function startScheduler(): void {
  cron.schedule('*/15 * * * *', async () => {
    console.log('[job] Weather sync');
    try {
      await syncWeather();
    } catch (err) {
      console.error('[job] Weather sync failed:', err);
    }
  });

  cron.schedule('*/5 * * * *', async () => {
    console.log('[job] Recommendation refresh');
    try {
      const driver = await getDefaultDriver();
      const shift = await getActiveShift(driver.id);
      let lat: number | undefined;
      let lng: number | undefined;
      if (shift) {
        const pos = await getLatestPosition(shift.id);
        if (pos) {
          lat = pos.latitude;
          lng = pos.longitude;
        }
      }
      await refreshRecommendations(lat, lng);
    } catch (err) {
      console.error('[job] Recommendation refresh failed:', err);
    }
  });

  cron.schedule('0 2 * * *', async () => {
    console.log('[job] Heatmap generation');
    try {
      await generateHeatmap();
    } catch (err) {
      console.error('[job] Heatmap generation failed:', err);
    }
  });

  console.log('Background jobs scheduled');
}
