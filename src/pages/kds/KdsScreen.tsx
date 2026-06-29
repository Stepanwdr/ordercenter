import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { acceptOrder, readyOrder, fetchScopeInfo, useOrderStream, type KdsOrder, type KdsScopeInfo, type KdsScopeKind } from '@features/kds/useOrderStream';
import { playSound } from '@shared/lib/sound';

const LS_RID = 'kds_restaurant_id'; // stores the scope id (restaurant OR branch id)
const LS_TOKEN = 'kds_device_token';
const LS_SCOPE = 'kds_scope_kind';

const API_IMG_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : u.startsWith('http') || u.startsWith('//') ? u : `${API_IMG_BASE}${u}`;

// New-order sound for the kitchen. Drop a file at public/sounds/new-order.mp3 or set
// VITE_KDS_SOUND. Falls back to a 3-tone chime.
const KDS_SOUND = (import.meta.env.VITE_KDS_SOUND as string | undefined) ?? '/sounds/new-order.mp3';

export default function KdsScreen() {
  const [scopeId, setScopeId] = useState(() => localStorage.getItem(LS_RID) || '');
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) || '');
  const [scopeKind, setScopeKind] = useState<KdsScopeKind>(
    () => (localStorage.getItem(LS_SCOPE) as KdsScopeKind) || 'restaurants',
  );
  const [configured, setConfigured] = useState(() => !!localStorage.getItem(LS_RID));

  if (!configured) {
    return (
      <Setup
        scopeKind={scopeKind}
        scopeId={scopeId}
        token={token}
        onScopeKind={setScopeKind}
        onChange={(id, t) => { setScopeId(id); setToken(t); }}
        onSave={() => {
          localStorage.setItem(LS_RID, scopeId.trim());
          localStorage.setItem(LS_TOKEN, token.trim());
          localStorage.setItem(LS_SCOPE, scopeKind);
          setConfigured(true);
        }}
      />
    );
  }

  return <Board scopeKind={scopeKind} scopeId={scopeId} token={token} onReconfigure={() => setConfigured(false)} />;
}

function Board({ scopeKind, scopeId, token, onReconfigure }: { scopeKind: KdsScopeKind; scopeId: string; token: string; onReconfigure: () => void }) {
  const { orders, conn, removeOrder } = useOrderStream(scopeKind, scopeId, token, () => playSound(KDS_SOUND, [660, 990, 1320]));
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [cooking, setCooking] = useState<Record<string, boolean>>({});
  const [info, setInfo] = useState<KdsScopeInfo | null>(null);

  useEffect(() => {
    let alive = true;
    fetchScopeInfo(scopeKind, scopeId, token)
      .then((i) => { if (alive) setInfo(i); })
      .catch(() => {});
    return () => { alive = false; };
  }, [scopeKind, scopeId, token]);

  // "Принял": kitchen started cooking. Keep the card on the board (so the composition stays
  // visible while preparing) and flip its button to "Готово".
  const accept = async (order: KdsOrder) => {
    setBusy((b) => ({ ...b, [order.id]: true }));
    try {
      await acceptOrder(scopeKind, scopeId, order.id, token);
      setCooking((c) => ({ ...c, [order.id]: true }));
    } catch {
      /* keep the card as-is so staff can retry */
    } finally {
      setBusy((b) => ({ ...b, [order.id]: false }));
    }
  };

  // "Готово": cooking finished → order goes to 'ready' and leaves the kitchen board.
  const markReady = async (order: KdsOrder) => {
    setBusy((b) => ({ ...b, [order.id]: true }));
    try {
      await readyOrder(scopeKind, scopeId, order.id, token);
      removeOrder(order.id);
    } catch {
      setBusy((b) => ({ ...b, [order.id]: false }));
    }
  };

  return (
    <Page>
      <TopBar>
        <Brand>
          {info?.logo ? (
            <BrandLogo src={resolveImg(info.logo)} alt={info.restaurantName || info.name || ''} />
          ) : (
            <BrandLogoFallback>🍽️</BrandLogoFallback>
          )}
          <BrandText>
            <Title>{info?.restaurantName || info?.name || 'Խոհանոց'}</Title>
            {info && (info.name !== info.restaurantName || info.address) && (
              <BrandSub>
                {info.name}{info.address ? ` · ${info.address}` : ''}
              </BrandSub>
            )}
          </BrandText>
        </Brand>
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
                    {it.note ? <Note>📝 {it.note}</Note> : null}
                    {(it.modifiers || []).map((m, i) => (
                      <Mod key={i}>+ {typeof m === 'string' ? m : m?.name}</Mod>
                    ))}
                  </li>
                ))}
              </Items>

              <CardFoot>
                {cooking[o.id] || o.status === 'cooking' || o.status === 'ready' ? (
                  <ReadyBtn style={{ width: '100%' }} disabled={!!busy[o.id]} onClick={() => markReady(o)}>
                    {busy[o.id] ? '…' : 'Готово'}
                  </ReadyBtn>
                ) : (
                  <AcceptBtn style={{ width: '100%' }} disabled={!!busy[o.id]} onClick={() => accept(o)}>
                    {busy[o.id] ? '…' : 'Принял'}
                  </AcceptBtn>
                )}
              </CardFoot>
            </Card>
          ))}
        </Grid>
      )}
    </Page>
  );
}

function Setup({
  scopeKind, scopeId, token, onScopeKind, onChange, onSave,
}: {
  scopeKind: KdsScopeKind;
  scopeId: string;
  token: string;
  onScopeKind: (k: KdsScopeKind) => void;
  onChange: (id: string, t: string) => void;
  onSave: () => void;
}) {
  return (
    <Page>
      <SetupCard>
        <Title style={{ marginBottom: 16 }}>Настройка KDS</Title>
        <Field>
          Тип точки
          <ScopeToggle>
            <ScopeBtn type="button" $active={scopeKind === 'branches'} onClick={() => onScopeKind('branches')}>Филиал</ScopeBtn>
            <ScopeBtn type="button" $active={scopeKind === 'restaurants'} onClick={() => onScopeKind('restaurants')}>Ресторан</ScopeBtn>
          </ScopeToggle>
        </Field>
        <Field>
          {scopeKind === 'branches' ? 'Branch ID (филиал)' : 'Restaurant ID'}
          <input value={scopeId} onChange={(e) => onChange(e.target.value, token)} placeholder={scopeKind === 'branches' ? 'UUID филиала' : 'UUID ресторана'} />
        </Field>
        <Field>
          Device token
          <input value={token} onChange={(e) => onChange(scopeId, e.target.value)} placeholder="channelConfig.deviceToken" />
        </Field>
        <AcceptBtn disabled={!scopeId.trim()} onClick={onSave} style={{ width: '100%', marginTop: 8 }}>
          Подключиться
        </AcceptBtn>
      </SetupCard>
    </Page>
  );
}

const ScopeToggle = styled.div`
  display: flex;
  gap: 8px;
`;
const ScopeBtn = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid ${({ $active }) => ($active ? '#4f8fff' : 'rgba(255,255,255,0.15)')};
  background: ${({ $active }) => ($active ? 'rgba(79,143,255,0.18)' : 'rgba(255,255,255,0.04)')};
  color: #fff;
  cursor: pointer;
  font-weight: 600;
`;

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
const Title = styled.h1` margin: 0; font-size: 22px; line-height: 1.1; `;
const Brand = styled.div` display: flex; align-items: center; gap: 12px; min-width: 0; `;
const BrandLogo = styled.img`
  width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04);
`;
const BrandLogoFallback = styled.div`
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 22px;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04);
`;
const BrandText = styled.div` display: flex; flex-direction: column; gap: 2px; min-width: 0; `;
const BrandSub = styled.span`
  font-size: 13px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
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
const Note = styled.span` display: block; font-size: 14px; color: #f59e0b; padding-left: 22px; font-weight: 600; `;
const CardFoot = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);
  width: 100%;
`;
const Total = styled.span` font-weight: 800; font-size: 16px; `;
const AcceptBtn = styled.button`
  border: none; border-radius: 10px; cursor: pointer; padding: 12px 22px;
  background: #34d399; color: #06281d; font-weight: 800; font-size: 15px;
  &:disabled { opacity: 0.5; cursor: default; }
  &:active { opacity: 0.85; }
`;
const ReadyBtn = styled(AcceptBtn)`
  background: #4f8fff; color: #04122e;
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
