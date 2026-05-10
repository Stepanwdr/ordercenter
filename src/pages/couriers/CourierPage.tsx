import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { useCourierQuery } from '@app/hooks/dataApi';
import type {Courier} from "@shared/types";

const PageRoot = styled.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  max-width: 620px;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.section`
  padding: 28px;
  border-radius: 24px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.14);
`;

const CardTitle = styled.h2`
  margin: 0 0 16px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`;

const CardValue = styled.p`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.7;
`;

const Section = styled.div`
  display: grid;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const SectionText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.75;
`;

const BackButton = styled(Button)`
  min-width: 160px;
`;

 const CourierPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: courierApi, isPending } = useCourierQuery(id ?? null);

  if (isPending) {
    return <PageRoot>
      <Title>Բեռնվում է</Title>
    </PageRoot>
  }


  if (!courierApi?.data) {
    return (
      <PageRoot>
        <Title>Courier not found</Title>
      </PageRoot>
    );
  }

  const data = courierApi?.data ?? ({} as Courier);
  const hasActiveOrder = data?.status === "free";
  // const statusLabel = courier.status === 'delivering' ? 'Առաքվում են' : courier.status === 'idle' ? 'Հանգստացածը' : 'Անցանց';

  return (
    <PageRoot>
      <Header>
        <TitleGroup>
          <Title>{data?.user?.name}</Title>
          <Subtitle>Полная карточка курьера с текущим статусом, контактами и последней информацией о доставке.</Subtitle>
        </TitleGroup>
        <div>
          <StatusBadge status={data?.status} />
        </div>
      </Header>

      <InfoGrid>
        <InfoCard>
          <CardTitle>Контактный телефон</CardTitle>
          <CardValue>{data?.user?.phone}</CardValue>
        </InfoCard>
        {data?.restaurant?.name && (
          <InfoCard>
            <CardTitle>Ресторан</CardTitle>
            <CardValue>{data?.restaurant?.name}</CardValue>
          </InfoCard>
        )}
        <InfoCard>
          <CardTitle>Текущий заказ</CardTitle>
          {/*<CardValue>{((data.currentOrders.map(o =>o.status))) ?? 'Нет активного заказа'}</CardValue>*/}
        </InfoCard>
        <InfoCard>
          <CardTitle>Расположение</CardTitle>
          {/*<CardValue>*/}
          {/*  {typeof courier?.lat === 'number' && typeof courier?.lng === 'number'*/}
          {/*    ? `${Number(courier.lat).toFixed(4)}, ${Number(courier.lng).toFixed(4)}`*/}
          {/*    : 'Не доступно'}*/}
          {/*</CardValue>*/}
        </InfoCard>
      </InfoGrid>

        <Section>
          <SectionTitle>Детали</SectionTitle>
          <SectionText>
          {hasActiveOrder
            ? 'Курьер активно доставляет заказ. Поддерживайте связь через систему и отслеживайте время доставки.'
            : 'Курьер свободен и готов к новым заданиям. Вы можете изменить его статус или назначить новый заказ.'}
          </SectionText>
        <BackButton variant="secondary" onClick={() => navigate('/couriers')}>
          Հետ առաքիչների ցուցակը
        </BackButton>
      </Section>
    </PageRoot>
  );
};
export default CourierPage
