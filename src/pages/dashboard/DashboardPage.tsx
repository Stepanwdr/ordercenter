import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Table } from '@shared/ux/Table';

const Grid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const Card = styled.div`
  padding: 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(22px);
`;

const Title = styled.h1`
  margin: 0 0 16px;
  color: #f8fbff;
`;

const Metric = styled.p`
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
`;

export const DashboardPage = () => {
  return (
    <div>
      <Title>Dispatch overview</Title>
      <Grid>
        <Card>
          <Subtitle>Active orders</Subtitle>
        </Card>
        <Card>
          <Subtitle>Pending jobs</Subtitle>
        </Card>
        <Card>
          <Subtitle>Today revenue</Subtitle>
        </Card>
        <Card>
          <Subtitle>Workflow</Subtitle>
          <Button>Review orders</Button>
        </Card>
      </Grid>
    </div>
  );
};
