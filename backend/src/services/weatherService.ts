import { prisma } from '../db';

const CALARASI_LAT = 44.1961;
const CALARASI_LNG = 27.3318;

export async function syncWeather(): Promise<void> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CALARASI_LAT}&lon=${CALARASI_LNG}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as {
          main: { temp: number };
          wind: { speed: number };
          rain?: { '1h'?: number };
        };
        await prisma.weatherSnapshot.create({
          data: {
            temperature: data.main.temp,
            rain: data.rain?.['1h'] ?? 0,
            windSpeed: data.wind.speed,
          },
        });
        return;
      }
    } catch {
      // fall through to mock
    }
  }

  await prisma.weatherSnapshot.create({
    data: {
      temperature: 18 + Math.random() * 10,
      rain: Math.random() > 0.8 ? Math.random() * 2 : 0,
      windSpeed: 5 + Math.random() * 15,
    },
  });
}
