import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { useProfileQuery } from '@app/hooks/profileApi';
import { useAuth } from '@app/providers/AuthProvider';
import { toast } from 'react-toastify';

// Basic Avatar component if not existing; add minimal version locally
// Fallback in case Avatar.tsx not present
// If you already have a global Avatar, you can replace this with an import.

const AvatarBox = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  font-weight: 700;
  font-size: 40px;
`;

const ProfileRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Details = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  align-items: start;
`;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
`;

const Value = styled.div`
  color: #fff;
`;

const EditPanel = styled.form`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const ProfilePage = () => {
  const { data: profileData } = useProfileQuery();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Local editable fields for profile
  const initial = useMemo(() => profileData ?? user ?? {}, [profileData, user]);
  const [name, setName] = useState<string>(initial?.name ?? '');
  const [email, setEmail] = useState<string>(initial?.email ?? '');
  const [avatar, setAvatar] = useState<string>(initial?.avatar ?? '');

  // Sync on data load
  // When profileData or user changes, reset local fields
  useMemo(() => {
    setName(initial?.name ?? '');
    setEmail(initial?.email ?? '');
    setAvatar(initial?.avatar ?? '');
  }, [initial?.name, initial?.email, initial?.avatar]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Update locally via AuthProvider (no server write in this minimal implementation)
    updateProfile({ name, email, avatar, avatarUrl: avatar } as any);
    // Show toast
    toast.success('Profile updated');
  };

  const initials = useMemo(() => {
    const nm = (name || profileData?.name || '').trim();
    if (!nm) return 'U';
    const parts = nm.split(' ');
    return (parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? 'n');
  }, [name, profileData?.name]);

  return (
    <ProfileRoot>
      <Header>
        <AvatarBox>
          {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </AvatarBox>
        <div>
          <h2 style={{ margin: 0 }}>{name || profileData?.name || profileData?.email?.split('@')[0] || 'Профиль'}</h2>
          <p style={{ color: 'rgba(255,255,255,0.72)' }}>{profileData?.email ?? user?.email}</p>
        </div>
      </Header>
      <Details>
        <Label>Имя</Label>
        <Value>{name || profileData?.name || user?.name}</Value>
        <Label>Электронная почта</Label>
        <Value>{email || profileData?.email || user?.email}</Value>
        <Label>Роль</Label>
        <Value>{profileData?.role ?? user?.role}</Value>
        <Label>Аватар</Label>
        <Value>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="URL аватара" />
        </Value>
      </Details>

      <EditPanel onSubmit={onSave}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Редактировать профиль</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Имя</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Avatar URL</div>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button type="submit">Сохранить</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Отмена</Button>
          </div>
        </div>
      </EditPanel>
    </ProfileRoot>
  );
};
