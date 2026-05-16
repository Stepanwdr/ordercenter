import styled from 'styled-components';
import type { Order } from '@shared/types';

const Container = styled.div<{ $bg: string }>`
  min-height: 100vh;
  background: ${({ $bg }) => $bg};
  color: ${({ theme }) => theme.colors?.text || '#fff'};
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const BackBtn = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #fff;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active { background: rgba(255, 255, 255, 0.15); }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
`;

const CardTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  margin-bottom: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  &:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.04); }
`;

const Label = styled.span`
  opacity: 0.6;
`;

const Value = styled.span`
  font-weight: 500;
  text-align: right;
  max-width: 60%;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  &:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.04); }
`;

const ItemName = styled.span`
  flex: 1;
`;

const ItemQty = styled.span`
  opacity: 0.5;
  margin: 0 8px;
`;

const ItemPrice = styled.span`
  font-weight: 600;
`;

const StatusActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button<{ $variant?: string }>`
  flex: 1;
  min-width: 100px;
  padding: 14px 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $variant }) =>
    $variant === 'accept' ? '#4f8fff' :
    $variant === 'pickup' ? '#ff8800' :
    $variant === 'deliver' ? '#9d7cff' :
    $variant === 'complete' ? '#34d399' :
    'rgba(255, 255, 255, 0.08)'};
  color: #fff;
  &:active { opacity: 0.7; }
  &:disabled { opacity: 0.4; }
`;

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  cooking: 'Cooking',
  ready: 'Ready',
  delivering: 'Delivering',
  completed: 'Completed',
};

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
}

export default function OrderDetailView({ order, onBack, onStatusUpdate }: OrderDetailViewProps) {
  const availableActions: { status: string; label: string; variant: string }[] = [];
  if (order.status === 'cooking' || order.status === 'ready') {
    availableActions.push({ status: 'cooking', label: 'Start Cooking', variant: 'accept' });
  }
  if (order.status === 'cooking') {
    availableActions.push({ status: 'ready', label: 'Mark Ready', variant: 'pickup' });
  }
  if (order.status === 'ready') {
    availableActions.push({ status: 'delivering', label: 'Start Delivery', variant: 'deliver' });
  }
  if (order.status === 'enRoute') {
    availableActions.push({ status: 'completed', label: 'Complete', variant: 'complete' });
  }

  return (
    <Container $bg="#090b11">
      <TopBar>
        <BackBtn onClick={onBack}>←</BackBtn>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Order #{order.code}</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.5 }}>
          {statusLabels[order.status] || order.status}
        </div>
      </TopBar>

      <Card>
        <CardTitle>Customer</CardTitle>
        {order.customerName && <Row><Label>Name</Label><Value>{order.customerName}</Value></Row>}
        {order.customerPhone && <Row><Label>Phone</Label><Value>{order.customerPhone}</Value></Row>}
        {order.orderType && <Row><Label>Type</Label><Value>{order.orderType}</Value></Row>}
      </Card>

      <Card>
        <CardTitle>Delivery</CardTitle>
        {order.deliveryAddress && <Row><Label>Address</Label><Value>{order.deliveryAddress}</Value></Row>}
        {order.entrance && <Row><Label>Entrance</Label><Value>{order.entrance}</Value></Row>}
        {order.floor && <Row><Label>Floor</Label><Value>{order.floor}</Value></Row>}
        {order.domofon && <Row><Label>Domofon</Label><Value>{order.domofon}</Value></Row>}
        {order.home && <Row><Label>Home</Label><Value>{order.home}</Value></Row>}
        {order.addressComment && <Row><Label>Comment</Label><Value>{order.addressComment}</Value></Row>}
        {order.restaurant?.name && <Row><Label>Restaurant</Label><Value>{order.restaurant.name}</Value></Row>}
        {order.prepTime && <Row><Label>Prep Time</Label><Value>{order.prepTime}</Value></Row>}
      </Card>

      <Card>
        <CardTitle>Items</CardTitle>
        {order.orderItems?.map((item) => (
          <ItemRow key={item.id}>
            <ItemName>{item.menuItem?.name || 'Item'}</ItemName>
            <ItemQty>x{item.quantity}</ItemQty>
            <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
          </ItemRow>
        ))}
        {(!order.orderItems || order.orderItems.length === 0) && (
          <Row><Label>No items listed</Label></Row>
        )}
        <Row style={{ marginTop: 8, borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
          <Label style={{ fontWeight: 700 }}>Total</Label>
          <Value style={{ fontWeight: 700 }}>${order.price?.toFixed(2)}</Value>
        </Row>
      </Card>

      {order.status !== 'done' && order.status !== 'ready' && (
        <Card>
          <CardTitle>Update Status</CardTitle>
          <StatusActions>
            {availableActions.map((action) => (
              <ActionButton
                key={action.status}
                $variant={action.variant}
                onClick={() => onStatusUpdate(order.id, action.status)}
              >
                {action.label}
              </ActionButton>
            ))}
            {availableActions.length === 0 && (
              <div style={{ opacity: 0.5, fontSize: 14 }}>No actions available</div>
            )}
          </StatusActions>
        </Card>
      )}
    </Container>
  );
}
