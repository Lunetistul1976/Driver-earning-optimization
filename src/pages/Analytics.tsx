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
import { AnalyticsData } from '../types';
import { PageTitle, Grid, Card, Section, SectionTitle } from '../styles/GlobalStyles';
import { theme } from '../styles/theme';

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });

  if (isLoading) return <PageTitle>Loading analytics...</PageTitle>;
  if (error || !data) return <PageTitle>Failed to load analytics</PageTitle>;

  const hourChart = data.revenueByHour.map((h: (typeof data.revenueByHour)[0]) => ({
    label: h.label,
    revenue: Math.round(h.totalRevenue * 100) / 100,
    avg: Math.round(h.avgRevenue * 100) / 100,
  }));

  const weekdayChart = data.revenueByWeekday.map((d: (typeof data.revenueByWeekday)[0]) => ({
    label: d.label.slice(0, 3),
    revenue: Math.round(d.totalRevenue * 100) / 100,
  }));

  const zoneChart = data.revenueByZone.map((z: (typeof data.revenueByZone)[0]) => ({
    label: z.zone.length > 12 ? z.zone.slice(0, 12) + '…' : z.zone,
    revenue: Math.round(z.totalRevenue * 100) / 100,
    rides: z.rideCount,
  }));

  const tooltipStyle = {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.sm,
  };

  return (
    <>
      <PageTitle>Analytics</PageTitle>

      <Section>
        <SectionTitle>Revenue by Hour</SectionTitle>
        <Card>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis dataKey="label" tick={{ fill: theme.colors.textMuted, fontSize: 10 }} />
              <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" name="Total Revenue (RON)" fill={theme.colors.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      <Grid $cols={2}>
        <Section>
          <SectionTitle>Revenue by Weekday</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekdayChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis dataKey="label" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Revenue (RON)" fill={theme.colors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>

        <Section>
          <SectionTitle>Revenue by Zone</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={zoneChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis type="number" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: theme.colors.textMuted, fontSize: 10 }}
                  width={90}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Revenue (RON)" fill={theme.colors.success} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      </Grid>
    </>
  );
}
