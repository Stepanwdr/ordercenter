import { type FormEvent, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Drawer } from '@shared/ux/Drawer';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import type {Address, ChannelConfig, DeliveryChannel, Printer, Restaurant} from '@shared/types';
import {useCreateRestaurantMutation, useRestaurantsQuery, useUpdateRestaurantMutation, useDeleteRestaurantMutation} from '@app/hooks/dataApi';
import {ImageUploader} from "@shared/ui/ImageUploader.tsx";
import { api } from '@shared/api/base';
import { useOutsideClick } from '@shared/lib/useOutsideClick';

const channelOptions: { value: DeliveryChannel; label: string }[] = [
  { value: 'client', label: 'Свой принтер/планшет (client)' },
  { value: 'iiko', label: 'iiko' },
  { value: 'rkeeper', label: 'r_keeper' },
];

const PageRoot = styled.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  margin: 0;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.18);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
    flex-direction: column;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const CardMeta = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.6;
`;

const Badge = styled.span<{ status: Restaurant['status'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: #fff;
  background: ${({ status }) =>
    status === 'open' ? '#34d399' : status === 'busy' ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)'};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CardContent = styled.div`
  display: grid;
  gap: 10px;
`;

const AddressList = styled.div`
  display: grid;
  gap: 8px;
`;

const AddressItem = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
`;

const Field = styled.label`
  display: grid;
  gap: 10px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

const AddressRow = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr auto;
  align-items: center;
  margin-bottom:10px ;
    
`;

const FooterText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.7;
`;

const Wrapper=styled.div`
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    gap: 20px;
`
const Image = styled.div`
   min-width: 150px;
   min-height: 150px;
   max-width: 400px;
   max-height: 200px;
   overflow: hidden;
   border-radius: 24px;
   img {
   width: 100%;
   height: 100%;
   object-fit: cover;
}
`
const Тabs = styled.div`
 display: flex;
 gap: 1rem;
 margin-bottom: 10px;
 `

const PrinterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 90px auto;
  gap: 8px;
  align-items: center;
`;

const BranchCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 12px;
`;

const SubLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

// Structured editor for a list of printers [{ name, ip, port }].
function PrintersEditor({ value, onChange }: { value?: Printer[]; onChange: (p: Printer[]) => void }) {
  const list = value ?? [];
  const update = (i: number, patch: Partial<Printer>) =>
    onChange(list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <SubLabel>Принтеры (имя · IP · порт)</SubLabel>
      {list.map((p, i) => (
        <PrinterRow key={i}>
          <Input value={p.name ?? ''} onChange={(e) => update(i, { name: e.target.value })} placeholder="kitchen" />
          <Input value={p.ip ?? ''} onChange={(e) => update(i, { ip: e.target.value })} placeholder="192.168.1.50" />
          <Input
            value={p.port != null ? String(p.port) : ''}
            onChange={(e) => update(i, { port: Number(e.target.value) || undefined })}
            placeholder="9100"
          />
          <Button variant="ghost" type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))}>
            ✕
          </Button>
        </PrinterRow>
      ))}
      <Button variant="secondary" type="button" onClick={() => onChange([...list, { ip: '', port: 9100 }])}>
        + Добавить принтер
      </Button>
    </div>
  );
}

const API_IMG_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : (u.startsWith('http') || u.startsWith('//')) ? u : `${API_IMG_BASE}${u}`;

const Logo = styled.img`
  width: 46px;
  height: 46px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
`;

const SliderWrap = styled.div`
  display: grid;
  gap: 10px;
`;
const SlidePhoto = styled.div`
  width: 100%;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const SlideInfo = styled.div`
  display: grid;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  strong { color: #fff; }
`;
const SliderNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  button {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    border-radius: 8px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 16px;
  }
`;
const Dots = styled.div`
  display: flex;
  gap: 6px;
`;
const Dot = styled.span<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#4f8fff' : 'rgba(255, 255, 255, 0.25)')};
`;

// Branches presented as a small carousel on the restaurant card.
function BranchSlider({ branches }: { branches: Address[] }) {
  const [i, setI] = useState(0);
  if (!branches.length) return null;
  const idx = Math.min(i, branches.length - 1);
  const b = branches[idx];
  return (
    <SliderWrap>
      {b.photo && (
        <SlidePhoto>
          <img src={resolveImg(b.photo)} alt={b.name || b.address} />
        </SlidePhoto>
      )}
      <SlideInfo>
        <strong>🏬 {[b.name, b.address].filter(Boolean).join(' · ')}</strong>
        {b.phone && <div>📞 {b.phone}</div>}
      </SlideInfo>
      {branches.length > 1 && (
        <SliderNav>
          <button type="button" onClick={() => setI((idx - 1 + branches.length) % branches.length)}>‹</button>
          <Dots>
            {branches.map((_, k) => (
              <Dot key={k} $active={k === idx} onClick={() => setI(k)} />
            ))}
          </Dots>
          <button type="button" onClick={() => setI((idx + 1) % branches.length)}>›</button>
        </SliderNav>
      )}
    </SliderWrap>
  );
}

type TreeSel = { restaurantId?: string; branchId?: string } | null;

const TreeWrap = styled.div`
  position: relative;
  min-width: 240px;
`;
const TreeTrigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
`;
const TreePop = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 360px;
  overflow: auto;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #141824;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
`;
const TreeItem = styled.div<{ $level: number; $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  padding-left: ${({ $level }) => 10 + $level * 18}px;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.82)')};
  background: ${({ $active }) => ($active ? 'rgba(79,143,255,0.18)' : 'transparent')};
  &:hover { background: rgba(255, 255, 255, 0.06); }
`;
const Caret = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  width: 18px;
  font-size: 12px;
`;

// Tree selector: restaurant → branch. Selecting filters the restaurant list.
function RestaurantTree({ restaurants, value, onChange }: {
  restaurants: Restaurant[];
  value: TreeSel;
  onChange: (v: TreeSel) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open);

  let label = 'Все рестораны';
  if (value?.restaurantId) {
    const r = restaurants.find((x) => x.id === value.restaurantId);
    if (r) {
      const b = value.branchId ? r.addresses?.find((a) => a.id === value.branchId) : undefined;
      label = b ? `${r.name} · ${b.name || b.address}` : r.name;
    }
  }

  return (
    <TreeWrap ref={ref}>
      <TreeTrigger type="button" onClick={() => setOpen((o) => !o)}>
        <span>🌳 {label}</span>
        <span>▾</span>
      </TreeTrigger>
      {open && (
        <TreePop>
          <TreeItem $level={0} onClick={() => { onChange(null); setOpen(false); }}>Все рестораны</TreeItem>
          {restaurants.map((r) => {
            const branches = (r.addresses ?? []).filter((b) => b.id);
            return (
              <div key={r.id}>
                <TreeItem $level={0} $active={value?.restaurantId === r.id && !value?.branchId}>
                  {branches.length > 0 ? (
                    <Caret type="button" onClick={(e) => { e.stopPropagation(); setExpanded((s) => ({ ...s, [r.id]: !s[r.id] })); }}>
                      {expanded[r.id] ? '▾' : '▸'}
                    </Caret>
                  ) : (
                    <span style={{ width: 18 }} />
                  )}
                  <span style={{ flex: 1 }} onClick={() => { onChange({ restaurantId: r.id }); setOpen(false); }}>
                    🏪 {r.name}
                  </span>
                </TreeItem>
                {expanded[r.id] && branches.map((b) => (
                  <TreeItem
                    key={b.id}
                    $level={1}
                    $active={value?.branchId === b.id}
                    onClick={() => { onChange({ restaurantId: r.id, branchId: b.id }); setOpen(false); }}
                  >
                    🏬 {b.name || b.address}
                  </TreeItem>
                ))}
              </div>
            );
          })}
        </TreePop>
      )}
    </TreeWrap>
  );
}

const initialFormState = {
  id: '',
  name: '',
  cuisine: '',
  addresses: [{address:""}] as Address[],
  phone: '',
  status: 'open' as Restaurant['status'],
};

const tabs=[
  {label:"Հիմնական տվյալներ",value:"details"},
  // {label:"Մենյու",value:"menu"},
]

 const RestaurantsPage = () => {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('0');
  const [lng, setLng] = useState('0');
  const [photoUrl, setPhotUrl] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  // Restaurant's OWN address + printers — used when it has no branches.
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPrinters, setRestaurantPrinters] = useState<Printer[]>([]);
  // Kitchen channel + printer config
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('client');
  const [printerIp, setPrinterIp] = useState('');
  const [printerPort, setPrinterPort] = useState('9100');
  const [printerRequired, setPrinterRequired] = useState(false);
  const [printerTimeout, setPrinterTimeout] = useState('');
  // Preserve other channelConfig keys (deviceToken, iiko creds) so editing the printer doesn't wipe them.
  const [existingChannelConfig, setExistingChannelConfig] = useState<ChannelConfig>({});
  // Only write channel/printer config back once we've actually loaded it (avoid wiping on a failed fetch).
  const [channelLoaded, setChannelLoaded] = useState(false);
  const [selectedTab,setSelectedTab] = useState(tabs[0].value);
  const { data: apiRestaurants } = useRestaurantsQuery();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [treeSel, setTreeSel] = useState<TreeSel>(null);
  const createRestaurant= useCreateRestaurantMutation()
  const updateRestaurant = useUpdateRestaurantMutation();
  const deleteRestaurantMutation = useDeleteRestaurantMutation();
  const mode = selectedRestaurant ? 'Edit' : 'Create';

  const resetChannelFields = () => {
    setDeliveryChannel('client');
    setPrinterIp('');
    setPrinterPort('9100');
    setPrinterRequired(false);
    setPrinterTimeout('');
    setExistingChannelConfig({});
    setLogoUrl('');
    setPhotUrl('');
    setRestaurantAddress('');
    setRestaurantPrinters([]);
  };

  const openForm = async (restaurant?: Restaurant) => {
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      // Populate form with existing restaurant data (best effort)
      // Keep id/name/phone so the upsert on save preserves each branch (and its orders' FK).
      const addressesFrom = restaurant.addresses?.length
        ? restaurant.addresses.map((a) => ({
            id: a.id,
            name: a.name ?? '',
            address: a.address ?? '',
            phone: a.phone ?? '',
            photo: a.photo ?? '',
            printers: a.channelConfig?.printers ?? [],
          }))
        : [];
      setFormState({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        addresses: addressesFrom,
        phone: restaurant.phone,
        status: restaurant.status,
      } as any);
      resetChannelFields();
      setChannelLoaded(false);
      setDeliveryChannel(restaurant.deliveryChannel ?? 'client');
      setIsDrawerOpen(true);
      // channelConfig is excluded from the public list — fetch the full record (authed).
      try {
        const res = await api.get<{ data: Restaurant }>(`/restaurants/${restaurant.id}`);
        const full = res.data?.data;
        const cc = (full?.channelConfig ?? {}) as ChannelConfig;
        setExistingChannelConfig(cc);
        setLogoUrl(full?.logo ?? '');
        setRestaurantAddress(full?.address ?? '');
        setRestaurantPrinters(Array.isArray(cc.printers) ? cc.printers : []);
        // The public list excludes branch channelConfig, so re-populate branches from the
        // full record to pick up each branch's printers + photo.
        if (full?.addresses?.length) {
          setFormState((s: any) => ({
            ...s,
            addresses: full.addresses!.map((a) => ({
              id: a.id,
              name: a.name ?? '',
              address: a.address ?? '',
              phone: a.phone ?? '',
              photo: a.photo ?? '',
              printers: Array.isArray(a.channelConfig?.printers) ? a.channelConfig!.printers : [],
            })),
          }));
        }
        if (full?.deliveryChannel) setDeliveryChannel(full.deliveryChannel);
        setChannelLoaded(true);
      } catch {
        // fetch failed — keep channelLoaded=false so saving won't overwrite the stored config
      }
      return;
    }
    setSelectedRestaurant(null);
    setFormState(initialFormState);
    resetChannelFields();
    setChannelLoaded(true); // new restaurant — fresh config is safe to write
    setIsDrawerOpen(true);
  };

  const closeForm = () => {
    setIsDrawerOpen(false);
    setSelectedRestaurant(null);
    setFormState(initialFormState);
    resetChannelFields();
  };

  const saveRestaurant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasBranches = formState.addresses.length > 0;
    const addressOk = hasBranches
      ? formState.addresses.some((b) => b.address.trim().length > 0)
      : restaurantAddress.trim().length > 0;
    if (!formState.name.trim() || !addressOk) return;

    const fd = new FormData();
    fd.append('name', formState.name);
    fd.append('lat', lat);
    fd.append('lng', lng);
    fd.append('phone', formState.phone);
    fd.append('cuisine', cuisine);
    fd.append('deliveryChannel', deliveryChannel);
    if (logoUrl) fd.append('logo', logoUrl);

    if (hasBranches) {
      // Address/photo/printers live per-branch (sent inside addresses).
      fd.append('addresses', JSON.stringify(formState.addresses));
    } else {
      // No branches → the restaurant carries its own address/photo/printers.
      fd.append('address', restaurantAddress);
      if (photoUrl) fd.append('photo', photoUrl);
      fd.append('printers', JSON.stringify(deliveryChannel === 'client' ? restaurantPrinters : []));
      fd.append('addresses', JSON.stringify([])); // clear any leftover branches
    }

    if (selectedRestaurant) {
      updateRestaurant.mutateAsync({ id: selectedRestaurant.id, payload: fd });
    } else {
      createRestaurant.mutateAsync(fd);
    }
    closeForm();
  };

  const handleDeleteRestaurant = (id: string) => {
    if (!window.confirm('Удалить ресторан?')) return;
    deleteRestaurantMutation.mutate(id);
  };

  const allRestaurants = apiRestaurants?.data || [];
  const q = query.trim().toLowerCase();
  const displayedRestaurants = allRestaurants.filter((r) => {
    if (treeSel?.restaurantId && r.id !== treeSel.restaurantId) return false;
    if (!q) return true;
    const inName = r.name.toLowerCase().includes(q);
    const inAddr = (r.address || '').toLowerCase().includes(q);
    const inBranch = (r.addresses ?? []).some(
      (b) => (b.name || '').toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q),
    );
    return inName || inAddr || inBranch;
  });
  return (
    <PageRoot>
      <Header>
        <div>
          <Title>Ռեստորաններ</Title>
          <FooterText>{displayedRestaurants.length} ռեստորան</FooterText>
        </div>
        <SearchBar>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск: ресторан или филиал…" />
          <RestaurantTree restaurants={allRestaurants} value={treeSel} onChange={setTreeSel} />
          <Button variant="primary" onClick={() => openForm()}>
            Ավելացնել ռեստորան
          </Button>
        </SearchBar>
      </Header>
      <Grid>
        {displayedRestaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {restaurant.logo && <Logo src={resolveImg(restaurant.logo)} alt={restaurant.name} />}
                <div>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardMeta>{restaurant.cuisine}</CardMeta>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {restaurant.addresses?.length ? (
                <BranchSlider branches={restaurant.addresses} />
              ) : (
                <>
                  {restaurant.photo && (
                    <Image>
                      <img src={resolveImg(restaurant.photo)} alt={restaurant.name} />
                    </Image>
                  )}
                  {restaurant.address && (
                    <AddressList>
                      <AddressItem>{restaurant.address}</AddressItem>
                    </AddressList>
                  )}
                </>
              )}
              <CardMeta>Phone: {restaurant.phone}</CardMeta>
            </CardContent>
            <Actions>
              <Button variant="secondary" onClick={() => openForm(restaurant)}>
                Խմբագրել
              </Button>
              <Button variant="secondary" onClick={() => handleDeleteRestaurant(restaurant.id)}>
                Ջնջել
              </Button>
            </Actions>
          </Card>
        ))}
      </Grid>

      <Drawer open={isDrawerOpen} title={`${mode === 'Create' ? 'Ստեղծել' : 'Խմբագրել'} ռեստորան`} onClose={closeForm} position="bottom">

        <form onSubmit={saveRestaurant}>
          <Wrapper>
            <Тabs>
              {tabs.map(tab =>
                <Button type={'button'} variant={tab.value === selectedTab ? 'ghost' : 'secondary'}
                        onClick={() => setSelectedTab(tab.value)}>
                  {tab.label}
                </Button>
              )}
            </Тabs>
          </Wrapper>
          {selectedTab === 'details' && <Wrapper>
            <Field>
              Անուն
              <Input
                value={formState.name}
                onChange={(event) => setFormState({...formState, name: event.target.value})}
                placeholder="Ռեստորանի անուն"
              />
            </Field>
            <Field>
              Հեռախոսահամար
              <Input
                value={formState.phone}
                onChange={(event) => setFormState({...formState, phone: event.target.value})}
                placeholder="+374 98 888 888"
              />
            </Field>
            <label>Логотип</label>
            <ImageUploader value={logoUrl} onChange={(payload) => setLogoUrl(payload?.url || '')} />
            <Input placeholder="URL логотипа или оставьте пустым" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />

            <Field>
              Канал доставки на кухню
              <Dropdown
                value={deliveryChannel}
                options={channelOptions}
                placeholder="Канал"
                onChange={(v) => setDeliveryChannel(v as DeliveryChannel)}
                triggerDisplay="chip"
              />
            </Field>

            {/* No branches → the restaurant carries its own address / photo / printers. */}
            {formState.addresses.length === 0 && (
              <>
                <Field>
                  Հասցե
                  <Input
                    value={restaurantAddress}
                    onChange={(e) => setRestaurantAddress(e.target.value)}
                    placeholder="Քաղաք, թաղամաս, շենք"
                  />
                </Field>
                <label>Фото</label>
                <ImageUploader value={photoUrl} onChange={(payload) => { setPhotUrl(payload?.url || ''); setPhotoFile(payload?.file as File | null); }} />
                <Input placeholder="URL или оставьте пустым" value={photoUrl} onChange={(e) => setPhotUrl(e.target.value)} />
                {deliveryChannel === 'client' && <PrintersEditor value={restaurantPrinters} onChange={setRestaurantPrinters} />}
              </>
            )}

            <Field>
              Մասնաճյուղեր
              <div>
                {formState.addresses.map((address, addressIndex) => {
                  const updateBranch = (patch: Partial<Address>) => {
                    const next = [...formState.addresses];
                    next[addressIndex] = {...next[addressIndex], ...patch};
                    setFormState({...formState, addresses: next});
                  };
                  return (
                    <BranchCard key={`branch-${addressIndex}`}>
                      <Input
                        value={address.name ?? ''}
                        onChange={(event) => updateBranch({name: event.target.value})}
                        placeholder="Անվանում (օր. Կենտրոն)"
                      />
                      <Input
                        value={address.address}
                        onChange={(event) => updateBranch({address: event.target.value})}
                        placeholder="Քաղաք, թաղամաս, շենք"
                      />
                      <Input
                        value={address.phone ?? ''}
                        onChange={(event) => updateBranch({phone: event.target.value})}
                        placeholder="Հեռախոս"
                      />
                      <SubLabel>Фото филиала</SubLabel>
                      <ImageUploader value={address.photo ?? ''} onChange={(payload) => updateBranch({photo: payload?.url || ''})} />
                      {deliveryChannel === 'client' && (
                        <PrintersEditor value={address.printers} onChange={(pr) => updateBranch({printers: pr})} />
                      )}
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => setFormState((current) => ({
                          ...current,
                          addresses: current.addresses.filter((_, index) => index !== addressIndex),
                        }))}
                      >
                        Удалить филиал
                      </Button>
                    </BranchCard>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setFormState((current) => ({
                  ...current,
                  addresses: [...current.addresses, {address: "", printers: []}],
                }))}
              >
                Ավելացնել մասնաճյուղ
              </Button>
            </Field>

            <Actions>
              <Button type="submit">Պահել</Button>
              <Button variant="secondary" type="button" onClick={closeForm}>
                Չեղարկել
              </Button>
            </Actions>
          </Wrapper>}
        </form>
      </Drawer>
    </PageRoot>
  );
};

 export default RestaurantsPage