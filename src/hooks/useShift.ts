import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useActiveShift() {
  return useQuery({
    queryKey: ['shift', 'active'],
    queryFn: api.getActiveShift,
    refetchInterval: 30000,
  });
}

export function useShiftActions() {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: api.startShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: api.endShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { startMutation, endMutation };
}

export function usePositionTracking(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        api
          .recordPosition(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.speed ?? undefined
          )
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['position'] });
          })
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api
            .recordPosition(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.speed ?? undefined
            )
            .catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }, 30000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [enabled, queryClient]);
}

export function useLatestPosition() {
  return useQuery({
    queryKey: ['position', 'latest'],
    queryFn: api.getLatestPosition,
    refetchInterval: 30000,
  });
}

export function useGeolocation() {
  return useQuery({
    queryKey: ['geolocation'],
    queryFn: () =>
      new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          reject,
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }),
    staleTime: 30000,
    retry: 1,
  });
}
