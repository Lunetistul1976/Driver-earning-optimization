import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import { DashboardData } from '../types';
import {
  PageTitle,
  Grid,
  Card,
  CardTitle,
  CardValue,
  Section,
  SectionTitle,
  Badge,
} from '../styles/GlobalStyles';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const RecommendationCard = styled(Card)`
  border-color: ${theme.colors.accent};
  background: linear-gradient(135deg, ${theme.colors.surface} 0%, #1a2a3a 100%);
`;

const RecZone = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.colors.accent};
  margin-bottom: 12px;
`;

const RecDetails = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  color: ${theme.colors.textMuted};
  font-size: 0.9rem;

  span strong {
    color: ${theme.colors.text};
    display: block;
    font-size: 1.1rem;
  }
`;

const ZoneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ZoneRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: ${theme.colors.surfaceHover};
  border-radius: ${theme.radius.sm};
  font-size: 0.9rem;
`;

function formatRon(value: number) {
  return `${value.toFixed(2)} RON`;
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) return <PageTitle>Loading dashboard...</PageTitle>;
  if (error || !data) return <PageTitle>Failed to load dashboard</PageTitle>;

  const chartData = data.bestHours
    .slice()
    .sort((a: (typeof data.bestHours)[0], b: (typeof data.bestHours)[0]) => a.hour - b.hour)
    .map((h: (typeof data.bestHours)[0]) => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      revenue: Math.round(h.avgRevenue * 100) / 100,
    }));

  return (
    <>
      <PageTitle>Dashboard</PageTitle>

      <Grid $cols={4}>
        <Card>
          <CardTitle>Today&apos;s Earnings</CardTitle>
          <CardValue>{formatRon(data.todayEarnings)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Earnings / Hour</CardTitle>
          <CardValue>{formatRon(data.currentEarningsPerHour)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Total Rides</CardTitle>
          <CardValue>{data.totalRides}</CardValue>
        </Card>
        <Card>
          <CardTitle>Avg Ride Value</CardTitle>
          <CardValue>{formatRon(data.avgRideValue)}</CardValue>
        </Card>
      </Grid>

      {data.bestRecommendation && (
        <Section>
          <SectionTitle>Best Zone Right Now</SectionTitle>
          <RecommendationCard>
            <RecZone>{data.bestRecommendation.zone}</RecZone>
            <RecDetails>
              <span>
                Expected / Hour
                <strong>{formatRon(data.bestRecommendation.expectedHourlyRevenue)}</strong>
              </span>
              {data.bestRecommendation.travelTimeMinutes != null && (
                <span>
                  Travel Time
                  <strong>{Math.round(data.bestRecommendation.travelTimeMinutes)} min</strong>
                </span>
              )}
              {data.bestRecommendation.distanceKm != null && (
                <span>
                  Distance
                  <strong>{data.bestRecommendation.distanceKm.toFixed(1)} km</strong>
                </span>
              )}
              <span>
                Score
                <strong>{data.bestRecommendation.score.toFixed(1)}</strong>
              </span>
            </RecDetails>
          </RecommendationCard>
        </Section>
      )}

      <Grid $cols={2}>
        <Section>
          <SectionTitle>Best Hours</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis dataKey="hour" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                  }}
                />
                <Bar dataKey="revenue" fill={theme.colors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section>
          <SectionTitle>Zone Rankings</SectionTitle>
          <Card>
            <ZoneList>
              {data.zoneRankings.slice(0, 6).map((z: (typeof data.zoneRankings)[0], i: number) => (
                <ZoneRow key={z.zoneId}>
                  <span>
                    <Badge $color={i === 0 ? theme.colors.success : theme.colors.primary}>
                      #{i + 1}
                    </Badge>{' '}
                    {z.zoneName}
                  </span>
                  <span>{formatRon(z.expectedHourlyRevenue)}/h</span>
                </ZoneRow>
              ))}
            </ZoneList>
          </Card>
        </Section>
      </Grid>
    </>
  );
}
