import { useMemo, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import { useRestaurantsQuery } from '@app/hooks/dataApi';
import {
  useCategoriesQuery,
  useCreateMenuItemMutation,
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useMenuItemsQuery,
  useMenusQuery,
  useUpdateMenuMutation,
} from '@app/hooks/menuApi';
import type { Restaurant } from '@shared/types/Restaurant';
import type { MenuItem } from '@shared/types/Menu';

const PageRoot = styled.main`
  display: grid;
  gap: 18px;
`;

const TopBar = styled.section`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1rem;
`;

const Shell = styled.section`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  display: grid;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const Grid2 = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: grid;
  gap: 8px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.68);
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  color: ${({ theme }) => theme.colors.text};
  background: rgba(255, 255, 255, 0.04);
  resize: vertical;
  outline: none;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const ItemList = styled.div`
  display: grid;
  gap: 8px;
`;

const ItemRow = styled.button<{ $active?: boolean }>`
  width: 100%;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(113, 159, 255, 0.65)' : 'rgba(255, 255, 255, 0.08)')};
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  background: ${({ $active }) => ($active ? 'rgba(113, 159, 255, 0.14)' : 'rgba(255, 255, 255, 0.03)')};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const Visual = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const InputWrapper = styled.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`

const toRestaurantOptions = (restaurants: Restaurant[]) =>
  restaurants.map((restaurant) => ({
    value: restaurant.id,
    label: restaurant.name,
  }));

const MenuManagementPage = () => {
  const { data: restaurantsResponse } = useRestaurantsQuery();
  const restaurants = restaurantsResponse?.data ?? [];
  const restaurantOptions = useMemo(() => toRestaurantOptions(restaurants), [restaurants]);

  const [restaurantId, setRestaurantId] = useState('');
  const menusQuery = useMenusQuery(restaurantId || null);
  const categoriesQuery = useCategoriesQuery();

  const menus = menusQuery.data ?? [];
  const menuOptions = menus.map((menu) => ({ value: menu.id, label: menu.name }));
  const categories = categoriesQuery.data ?? [];
  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));

  const [newMenuName, setNewMenuName] = useState('');
  const createMenu = useCreateMenuMutation(restaurantId);
  const updateMenu = useUpdateMenuMutation(restaurantId);
  const deleteMenu = useDeleteMenuMutation(restaurantId);

  const [menuId, setMenuId] = useState('');
  const menuItemsQuery = useMenuItemsQuery(menuId || null);
  const menuItems = menuItemsQuery.data ?? [];
  const createMenuItem = useCreateMenuItemMutation(menuId);

  const [activeItemId, setActiveItemId] = useState('');
  const activeItem = menuItems.find((item) => item.id === activeItemId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [volumeValue, setVolumeValue] = useState('');
  const [volumeName, setVolumeName] = useState('');
  const [price, setPrice] = useState('0');
  const [image, setImage] = useState('');

  const resetForm = () => {
    setActiveItemId('');
    setName('');
    setDescription('');
    setCategoryId('');
    setQuantity('1');
    setVolumeValue('');
    setVolumeName('');
    setPrice('0');
    setImage('');
  };

  const selectItem = (item: MenuItem) => {
    setActiveItemId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setCategoryId(item.categoryId);
    setQuantity(String(item.quantity));
    setVolumeValue(item.volumeValue != null ? String(item.volumeValue) : '');
    setVolumeName(item.volumeName ?? '');
    setPrice(String(item.price));
    setImage(item.image ?? '');
  };

  const onCreateMenu = async (event: FormEvent) => {
    event.preventDefault();
    if (!restaurantId || !newMenuName.trim()) return;
    await createMenu.mutateAsync({ name: newMenuName.trim() });
    setNewMenuName('');
  };

  const onDeleteMenu = async () => {
    if (!menuId) return;
    await deleteMenu.mutateAsync(menuId);
    setMenuId('');
    resetForm();
  };

  const onRenameMenu = async () => {
    if (!menuId || !newMenuName.trim()) return;
    await updateMenu.mutateAsync({ menuId, payload: { name: newMenuName.trim() } });
    setNewMenuName('');
  };

  const onSaveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!menuId || !name.trim() || !categoryId) return;
    await createMenuItem.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId,
      quantity: Math.max(1, Number(quantity) || 1),
      volumeValue: volumeValue ? Number(volumeValue) : undefined,
      volumeName: volumeName.trim() || undefined,
      price: Math.max(0, Number(price) || 0),
      image: image.trim() || undefined,
    });
    resetForm();
  };

  return (
    <PageRoot>
      <TopBar>
        <Title>Մենյուի կառավարում</Title>
      </TopBar>
      <Card as="form" onSubmit={onCreateMenu}>
        <CardTitle>Menus</CardTitle>
        <Grid2>
          <Dropdown label={'Ընտրել ռեստորանը'} value={restaurantId} options={restaurantOptions} placeholder="Ընտրել ռեստորանը" onChange={setRestaurantId} />
          <InputWrapper>
            <Label>
              Նոր / Անվանափոխել
            </Label>
            <Input value={newMenuName} onChange={(event) => setNewMenuName(event.target.value)} placeholder="Նոր / Անվանափոխել" />
          </InputWrapper>
          <Dropdown label={'Ընտրել մենյուն'} value={menuId} options={menuOptions} placeholder="Ընտրել մենյուն" onChange={setMenuId} />
        </Grid2>
        <Actions>
          <Button type="submit" disabled={!restaurantId || createMenu.isPending}>Ստեղծել մենյու</Button>
          <Button type="button" variant="secondary" onClick={onRenameMenu} disabled={!menuId || updateMenu.isPending}>Անվանափոխել</Button>
          <Button type="button" variant="ghost" onClick={onDeleteMenu} disabled={!menuId || deleteMenu.isPending}>Ջնջել</Button>
        </Actions>
      </Card>
      <Shell>
        <Card as="form" onSubmit={onSaveItem}>
          <CardTitle>Խմբագրել ապրանքը</CardTitle>
          <Grid2>
            <Label>
              Ապրանքի անունը
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter product name" />
            </Label>
            <Label>
              Կատեգորիան
              <Dropdown value={categoryId} options={categoryOptions} placeholder="Select category" onChange={setCategoryId} />
            </Label>
          </Grid2>

          <Label>
            Նկարագրություն
            <TextArea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Product description..." />
          </Label>
          <CardTitle>Գույքագրում և գնագոյացում</CardTitle>
          <Grid2>
            <Label>
              Գին
              <Input type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
            </Label>
          </Grid2>
          <Grid2>
            <Label>
              Ծավալ (թիվ)
              <Input
                type="number"
                min={0}
                step="0.01"
                value={volumeValue}
                onChange={(event) => setVolumeValue(event.target.value)}
                placeholder="0.5"
              />
            </Label>
            <Label>
              Ծավալ (միավոր)
              <Input
                value={volumeName}
                onChange={(event) => setVolumeName(event.target.value)}
                placeholder="լ / մլ / գ"
              />
            </Label>
          </Grid2>

          <Label>
            Նկար URL
            <Input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://..." />
          </Label>

          <FooterBar>
            <Button type="button" variant="secondary" onClick={resetForm}>Չեղարկել</Button>
            <Button type="submit" disabled={!menuId || createMenuItem.isPending}>
              {createMenuItem.isPending ? 'Saving...' : 'Save Product'}
            </Button>
          </FooterBar>
        </Card>

        <Card>
          <CardTitle>Ապրանքի նկարը</CardTitle>
          <Visual>
            {image ? <img src={image} alt={name || 'dish'} /> : null}
          </Visual>

          <CardTitle>Առկա ապրանքները</CardTitle>
          {menuId && menuItems.length === 0 && <Muted>Մենյուն դատարկ է</Muted>}
          {!menuId && <Muted>Ընտրել մենյուն ապրանք ավելացնելու համար</Muted>}
          {menuItems.length > 0 && (
            <ItemList>
              {menuItems.map((item) => (
                <ItemRow key={item.id} type="button" $active={item.id === activeItemId} onClick={() => selectItem(item)}>
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </ItemRow>
              ))}
            </ItemList>
          )}
          {activeItem && <Muted>Ընտրված: {activeItem.name} (article #{activeItem.article})</Muted>}
        </Card>
      </Shell>
    </PageRoot>
  );
};

export default MenuManagementPage;
