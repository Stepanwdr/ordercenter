import styled from 'styled-components';

const PageRoot = styled.main`
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
`;

const Cards = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  padding: 26px;
  border-radius: 28px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
`;

const CardTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 1.1rem;
`;

const CardText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.8;
`;

export const SettingsPage = () => (
  <PageRoot>
    <Header>
      <Title>Настройки</Title>
      <Subtitle>Управляйте общими параметрами системы и доступом.</Subtitle>
    </Header>

    <Cards>
      <Card>
        <CardTitle>Профиль</CardTitle>
        <CardText>Здесь вы можете обновить информацию своего аккаунта, email и имя.</CardText>
      </Card>
      <Card>
        <CardTitle>Уведомления</CardTitle>
        <CardText>Включайте или отключайте системные уведомления и оповещения.</CardText>
      </Card>
      <Card>
        <CardTitle>Безопасность</CardTitle>
        <CardText>Настройте параметры пароля и двухфакторной аутентификации.</CardText>
      </Card>
      <Card>
        <CardTitle>Интеграции</CardTitle>
        <CardText>Подключайте внешние сервисы и инструменты для работы с заказами.</CardText>
      </Card>
    </Cards>
  </PageRoot>
);
