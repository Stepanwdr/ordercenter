import styled from 'styled-components';

const statusColors: Record<string, string> = {
  new: '#9ca3ff',
  cooking: '#f59e0b',
  ready: '#38bdf8',
  delivering: '#9d7cff',
  done: '#34d399',
};

const Badge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${({ status }) => statusColors[status] ?? '#64748b'};
`;

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge status={status}>{status.toUpperCase()}</Badge>
);
