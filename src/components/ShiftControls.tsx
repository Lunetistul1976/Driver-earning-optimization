import { useActiveShift, useShiftActions } from '../hooks/useShift';
import { Button } from '../styles/GlobalStyles';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Status = styled.div<{ $active: boolean }>`
  font-size: 0.8rem;
  color: ${({ $active }) => ($active ? theme.colors.success : theme.colors.textMuted)};
  font-weight: 600;
`;

const Time = styled.div`
  font-size: 0.75rem;
  color: ${theme.colors.textMuted};
`;

export default function ShiftControls() {
  const { data: shift, isLoading } = useActiveShift();
  const { startMutation, endMutation } = useShiftActions();

  if (isLoading) return <Container>Loading...</Container>;

  const isActive = !!shift && !shift.endTime;

  return (
    <Container>
      <Status $active={isActive}>
        {isActive ? '● Shift Active' : '○ No Active Shift'}
      </Status>
      {isActive && shift && (
        <Time>Started {new Date(shift.startTime).toLocaleTimeString()}</Time>
      )}
      {isActive && shift ? (
        <Button
          $variant="danger"
          onClick={() => endMutation.mutate(shift.id)}
          disabled={endMutation.isPending}
        >
          End Shift
        </Button>
      ) : (
        <Button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          Start Shift
        </Button>
      )}
    </Container>
  );
}
