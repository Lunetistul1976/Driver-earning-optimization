import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { RideLogEntry } from '../types';
import {
  PageTitle,
  Card,
  Table,
  Button,
  Badge,
  Section,
  SectionTitle,
} from '../styles/GlobalStyles';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useGeolocation } from '../hooks/useShift';

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 10px 14px;
  border-radius: ${theme.radius.sm};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.surfaceHover};
  color: ${theme.colors.text};
  font-size: 0.9rem;
  width: 120px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

function formatRon(value: number) {
  return `${value.toFixed(2)} RON`;
}

export default function RidesPage() {
  const queryClient = useQueryClient();
  const { data: rides, isLoading } = useQuery<RideLogEntry[]>({
    queryKey: ['rides'],
    queryFn: api.getRides,
  });

  const { data: geo } = useGeolocation();
  const [pendingRideId, setPendingRideId] = useState<string | null>(null);
  const [fareInput, setFareInput] = useState('');

  const acceptMutation = useMutation({
    mutationFn: () => {
      const lat = geo?.lat ?? 44.1961;
      const lng = geo?.lng ?? 27.3318;
      return api.acceptRide(lat, lng);
    },
    onSuccess: (ride) => {
      setPendingRideId(ride.id);
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, fare }: { id: string; fare: number }) => {
      const lat = geo?.lat ?? 44.1961;
      const lng = geo?.lng ?? 27.3318;
      return api.completeRide(id, fare, lat, lng);
    },
    onSuccess: () => {
      setPendingRideId(null);
      setFareInput('');
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const activePending = rides?.find((r: RideLogEntry) => r.status === 'accepted') ?? null;
  const rideToComplete = pendingRideId ?? activePending?.id ?? null;

  return (
    <>
      <PageTitle>Ride Log</PageTitle>

      <Section>
        <SectionTitle>Quick Actions</SectionTitle>
        <Actions>
          {!rideToComplete ? (
            <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? 'Accepting...' : 'Accept Ride'}
            </Button>
          ) : (
            <FormRow>
              <Input
                type="number"
                placeholder="Fare (RON)"
                value={fareInput}
                onChange={(e) => setFareInput(e.target.value)}
                step="0.01"
                min="0"
              />
              <Button
                onClick={() =>
                  completeMutation.mutate({
                    id: rideToComplete,
                    fare: parseFloat(fareInput) || 0,
                  })
                }
                disabled={completeMutation.isPending || !fareInput}
              >
                Complete Ride
              </Button>
            </FormRow>
          )}
        </Actions>
      </Section>

      <Card>
        {isLoading ? (
          <p>Loading rides...</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fare</th>
                <th>Duration</th>
                <th>Pickup Zone</th>
                <th>Dropoff Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rides?.map((ride: RideLogEntry) => (
                <tr key={ride.id}>
                  <td>{new Date(ride.date).toLocaleString()}</td>
                  <td>{ride.fareAmount > 0 ? formatRon(ride.fareAmount) : '—'}</td>
                  <td>{ride.durationMinutes ? `${ride.durationMinutes} min` : '—'}</td>
                  <td>{ride.pickupZone}</td>
                  <td>{ride.dropoffZone}</td>
                  <td>
                    <Badge
                      $color={
                        ride.status === 'completed' ? theme.colors.success : theme.colors.warning
                      }
                    >
                      {ride.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rides?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: theme.colors.textMuted }}>
                    No rides logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
