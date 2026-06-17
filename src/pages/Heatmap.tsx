import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { HeatmapData, Zone } from '../types';
import { PageTitle, Card } from '../styles/GlobalStyles';
import { theme } from '../styles/theme';
import { useLatestPosition, useGeolocation } from '../hooks/useShift';
import styled from 'styled-components';

const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const CALARASI_CENTER: [number, number] = [44.1961, 27.3318];

const MapWrapper = styled(Card)`
  padding: 0;
  overflow: hidden;
  height: calc(100vh - 120px);
  min-height: 500px;
`;

const Legend = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.sm};
  padding: 12px 16px;
  font-size: 0.8rem;
`;

const LegendItem = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
`;

function scoreToColor(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio > 0.66) return theme.colors.success;
  if (ratio > 0.33) return theme.colors.warning;
  return theme.colors.danger;
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function HeatmapPage() {
  const { data, isLoading } = useQuery<HeatmapData>({
    queryKey: ['heatmap'],
    queryFn: () => api.getHeatmap(),
    refetchInterval: 300000,
  });

  const { data: serverPosition } = useLatestPosition();
  const { data: geoPosition } = useGeolocation();

  const driverPos: [number, number] | null = serverPosition
    ? [serverPosition.latitude, serverPosition.longitude]
    : geoPosition
      ? [geoPosition.lat, geoPosition.lng]
      : null;

  if (isLoading || !data) return <PageTitle>Loading map...</PageTitle>;

  const maxScore = Math.max(...data.zoneScores.map((z: HeatmapData['zoneScores'][0]) => z.score), 1);

  return (
    <>
      <PageTitle>Live Map — Călărași</PageTitle>
      <MapWrapper>
        <MapContainer
          center={driverPos ?? CALARASI_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          {driverPos && <MapCenterController center={driverPos} />}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {data.zones.map((zone: Zone) => {
            const zoneScore = data.zoneScores.find(
              (z: HeatmapData['zoneScores'][0]) => z.zoneId === zone.id
            );
            const score = zoneScore?.score ?? 0;
            const color = scoreToColor(score, maxScore);

            return (
              <Circle
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={zone.radiusMeters}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{zone.name}</strong>
                  <br />
                  Score: {score.toFixed(1)}
                  {zoneScore && <><br />Rank: #{zoneScore.rank}</>}
                </Popup>
              </Circle>
            );
          })}

          {data.cells.map((cell: HeatmapData['cells'][0]) => (
            <Circle
              key={cell.id}
              center={[cell.latitude, cell.longitude]}
              radius={200}
              pathOptions={{
                color: scoreToColor(cell.score, 1),
                fillColor: scoreToColor(cell.score, 1),
                fillOpacity: 0.4,
                weight: 1,
              }}
            />
          ))}

          {driverPos && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>Your position</Popup>
            </Marker>
          )}

          <Legend>
            <LegendItem $color={theme.colors.success}>High profitability</LegendItem>
            <LegendItem $color={theme.colors.warning}>Medium</LegendItem>
            <LegendItem $color={theme.colors.danger}>Low</LegendItem>
          </Legend>
        </MapContainer>
      </MapWrapper>
    </>
  );
}
