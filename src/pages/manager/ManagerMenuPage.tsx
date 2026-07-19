import styled from 'styled-components';
import { useManagerMenuQuery, type ManagerMenuItem } from '@app/hooks/managerApi';
import { useManagerCtx } from './ManagerLayout';

const API_IMG_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : u.startsWith('http') || u.startsWith('//') ? u : `${API_IMG_BASE}${u}`;
const money = (v: number) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ManagerMenuPage() {
  const { restaurantId } = useManagerCtx();
  const { data: menus = [], isPending } = useManagerMenuQuery({ restaurantId: restaurantId || undefined });

  const totalItems = menus.reduce((s, m) => s + m.items.length, 0);

  if (isPending) return <Empty>Загрузка…</Empty>;
  if (totalItems === 0) return <Empty>Меню пусто</Empty>;

  return (
    <div>
      {menus.map((m) => (
        <Panel key={m.id}>
          <PanelTitle>{m.name} <Muted>· {m.items.length}</Muted></PanelTitle>
          <Grid>
            {m.items.map((it) => <ItemCard key={it.id} item={it} />)}
          </Grid>
        </Panel>
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: ManagerMenuItem }) {
  return (
    <Card>
      <Thumb>
        {item.image ? <img src={resolveImg(item.image)} alt={item.name} /> : <span>🍽️</span>}
      </Thumb>
      <Body>
        <Name>{item.name}</Name>
        {item.category && <Cat>{item.category}</Cat>}
        {item.description && <Desc title={item.description}>{item.description}</Desc>}
      </Body>
      <Price>{money(item.price)}</Price>
    </Card>
  );
}

/* ---------- styles ---------- */
const Panel = styled.section`
  background: #121722; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px; margin-bottom: 18px;
`;
const PanelTitle = styled.h2` margin: 0 0 14px; font-size: 16px; font-weight: 700; `;
const Muted = styled.span` opacity: 0.5; font-weight: 500; font-size: 13px; `;
const Grid = styled.div`
  display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;
const Card = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 10px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;
`;
const Thumb = styled.div`
  width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0; overflow: hidden;
  background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 22px;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const Body = styled.div` flex: 1; min-width: 0; `;
const Name = styled.div` font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
const Cat = styled.div` font-size: 12px; color: #34d399; `;
const Desc = styled.div` font-size: 12px; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
const Price = styled.div` font-weight: 800; font-size: 15px; white-space: nowrap; `;
const Empty = styled.div` text-align: center; opacity: 0.45; padding: 64px 0; `;
