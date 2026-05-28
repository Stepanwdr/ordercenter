import styled from 'styled-components';
import { useOrdersStatsQuery } from '@app/hooks/dataApi';
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

const Count = styled.p`
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
`;

 const DashboardPage = () => {
  const { data: stats } = useOrdersStatsQuery();
  return (
    <div>
      <Title>Dispatch overview</Title>
      <Grid>
        <Card>
          <Subtitle>Active orders</Subtitle>
          <Count>{stats?.active ?? 0}</Count>
        </Card>
        <Card>
          <Subtitle>Completed orders</Subtitle>
          <Count>{stats?.completed ?? 0}</Count>
        </Card>
        <Card>
          <Subtitle>Total orders</Subtitle>
          <Count>{stats?.total ?? 0}</Count>
        </Card>
      </Grid>
    </div>
  );
};

 export default DashboardPage;