import { useState } from 'react';
import styled from 'styled-components';
import { acceptOrder, useOrderStream, type KdsOrder } from '@features/kds/useOrderStream';

const LS_RID = 'kds_restaurant_id';
const LS_TOKEN = 'kds_device_token';

export default function KdsScreen() {
  const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem(LS_RID) || '');
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) || '');
  const [configured, setConfigured] = useState(() => !!localStorage.getItem(LS_RID));

  if (!configured) {
    return (
      <Setup
        restaurantId={restaurantId}
        token={token}
        onChange={(rid, t) => { setRestaurantId(rid); setToken(t); }}
        onSave={() => {
          localStorage.setItem(LS_RID, restaurantId.trim());
          localStorage.setItem(LS_TOKEN, token.trim());
          setConfigured(true);
        }}
      />
    );
  }

  return <Board restaurantId={restaurantId} token={token} onReconfigure={() => setConfigured(false)} />;
}

function Board({ restaurantId, token, onReconfigure }: { restaurantId: string; token: string; onReconfigure: () => void }) {
  const { orders, conn, removeOrder } = useOrderStream(restaurantId, token);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const accept = async (order: KdsOrder) => {
    setBusy((b) => ({ ...b, [order.id]: true }));
    try {
      await acceptOrder(restaurantId, order.id, token);
      removeOrder(order.id); // accepted — drop from the board
    } catch {
      setBusy((b) => ({ ...b, [order.id]: false }));
    }
  };

  return (
    <Page>
      <TopBar>
        <Title>Կухня · Заказы</Title>
        <Right>
          <Conn $state={conn}>
            <Dot $state={conn} />
            {conn === 'online' ? 'на связи' : conn === 'connecting' ? 'подключение…' : 'нет связи'}
          </Conn>
          <GearBtn onClick={onReconfigure} title="Настройки">⚙</GearBtn>
        </Right>
      </TopBar>

      {orders.length === 0 ? (
        <Empty>Нет новых заказов</Empty>
      ) : (
        <Grid>
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHead>
                <Code>#{o.code}</Code>
                <Time>{new Date(o.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</Time>
              </CardHead>

              {(o.customer?.name || o.customer?.phone) && (
                <Customer>
                  {o.customer?.name}{o.customer?.phone ? ` · ${o.customer.phone}` : ''}
                </Customer>
              )}

              <Items>
                {o.items.map((it) => (
                  <li key={it.id}>
                    <Qty>{it.quantity}×</Qty> {it.name}
                    {(it.modifiers || []).map((m, i) => (
                      <Mod key={i}>+ {typeof m === 'string' ? m : m?.name}</Mod>
                    ))}
                  </li>
                ))}
              </Items>

              <CardFoot>
                <Total>{Number(o.total).toFixed(2)}</Total>
                <AcceptBtn disabled={!!busy[o.id]} onClick={() => accept(o)}>
                  {busy[o.id] ? '…' : 'Принял'}
                </AcceptBtn>
              </CardFoot>
            </Card>
          ))}
        </Grid>
      )}
    </Page>
  );
}

function Setup({
  restaurantId, token, onChange, onSave,
}: {
  restaurantId: string; token: string; onChange: (rid: string, t: string) => void; onSave: () => void;
}) {
  return (
    <Page>
      <SetupCard>
        <Title style={{ marginBottom: 16 }}>Настройка KDS</Title>
        <Field>
          Restaurant ID
          <input value={restaurantId} onChange={(e) => onChange(e.target.value, token)} placeholder="UUID ресторана" />
        </Field>
        <Field>
          Device token
          <input value={token} onChange={(e) => onChange(restaurantId, e.target.value)} placeholder="channelConfig.deviceToken" />
        </Field>
        <AcceptBtn disabled={!restaurantId.trim()} onClick={onSave} style={{ width: '100%', marginTop: 8 }}>
          Подключиться
        </AcceptBtn>
      </SetupCard>
    </Page>
  );
}

/* ---------- styles ---------- */
const Page = styled.div`
  min-height: 100vh;
  background: #0b0e14;
  color: #fff;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;
const TopBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
`;
const Title = styled.h1` margin: 0; font-size: 22px; `;
const Right = styled.div` display: flex; align-items: center; gap: 12px; `;
const Conn = styled.div<{ $state: string }>`
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600;
  color: ${({ $state }) => ($state === 'online' ? '#34d399' : $state === 'connecting' ? '#f59e0b' : '#ef4444')};
`;
const Dot = styled.span<{ $state: string }>`
  width: 10px; height: 10px; border-radius: 50%;
  background: ${({ $state }) => ($state === 'online' ? '#34d399' : $state === 'connecting' ? '#f59e0b' : '#ef4444')};
`;
const GearBtn = styled.button`
  width: 36px; height: 36px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #fff; font-size: 16px;
`;
const Grid = styled.div`
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;
const Card = styled.div`
  background: #151a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
  padding: 14px; display: flex; flex-direction: column; gap: 10px;
`;
const CardHead = styled.div` display: flex; justify-content: space-between; align-items: baseline; `;
const Code = styled.span` font-weight: 800; font-size: 18px; `;
const Time = styled.span` opacity: 0.6; font-size: 14px; `;
const Customer = styled.div` font-size: 14px; opacity: 0.85; `;
const Items = styled.ul`
  list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 16px;
  li { line-height: 1.35; }
`;
const Qty = styled.span` color: #4f8fff; font-weight: 800; `;
const Mod = styled.span` display: block; font-size: 13px; opacity: 0.6; padding-left: 22px; `;
const CardFoot = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);
`;
const Total = styled.span` font-weight: 800; font-size: 16px; `;
const AcceptBtn = styled.button`
  border: none; border-radius: 10px; cursor: pointer; padding: 12px 22px;
  background: #34d399; color: #06281d; font-weight: 800; font-size: 15px;
  &:disabled { opacity: 0.5; cursor: default; }
  &:active { opacity: 0.85; }
`;
const Empty = styled.div` text-align: center; opacity: 0.45; padding: 80px 0; font-size: 18px; `;
const SetupCard = styled.div`
  max-width: 420px; margin: 60px auto; background: #151a24; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 24px;
`;
const Field = styled.label`
  display: grid; gap: 8px; margin-bottom: 16px; font-size: 13px; color: rgba(255,255,255,0.7);
  input {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
    color: #fff; padding: 12px 14px; font-size: 15px;
  }
`;
