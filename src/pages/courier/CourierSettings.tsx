import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useAuth } from '@app/providers/AuthProvider';
import { useGetMe } from '@app/hooks/dataApi';
import { api } from '@shared/api/base';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const resolveAvatar = (avatar?: string) => {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${API_BASE}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
};

const Page = styled.div`
  min-height: 100vh;
  background: #090b11;
  color: #fff;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 100px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const BackBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active { opacity: 0.7; }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  margin-bottom: 24px;
`;

const AvatarBtn = styled.button`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: #4f8fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  &:active { opacity: 0.85; }
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarEditBadge = styled.span`
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #141824;
  border: 2px solid #090b11;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
`;

const AvatarOverlay = styled.span`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
`;

const HiddenInput = styled.input`
  display: none;
`;

const ProfileName = styled.div`
  font-weight: 700;
  font-size: 18px;
`;

const ProfileRole = styled.div`
  font-size: 13px;
  opacity: 0.5;
  margin-top: 2px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.4;
  margin: 0 4px 8px;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  font-size: 14px;
  & + & { border-top: 1px solid rgba(255, 255, 255, 0.05); }
`;

const InfoKey = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.6;
`;

const InfoValue = styled.span`
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
  word-break: break-word;
`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 14px;
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  &:active { opacity: 0.7; }
`;

export default function CourierSettings() {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();
  const { data: courierData, refetch } = useGetMe();
  const courier = courierData?.data;
  const user = courier?.user;
  const userId = courier?.userId || authUser?.id || '';

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Ընտրեք նկար');
      return;
    }
    if (!userId) {
      toast.error('Օգտատերը հայտնի չէ');
      return;
    }
    setUploading(true);
    try {
      // 1) upload the image file → get its public URL
      const form = new FormData();
      form.append('image', file);
      const up = await api.post<{ url: string }>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = up.data.url;
      // 2) persist it on the courier's user profile
      await api.put(`/couriers/${userId}`, { avatar: url });
      await refetch();
      toast.success('Ավատարը թարմացվեց');
    } catch {
      toast.error('Չհաջողվեց պահել ավատարը');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = resolveAvatar(user?.avatar);

  return (
    <Page>
      <TopBar>
        <BackBtn onClick={() => navigate('/')} aria-label="Հետ">‹</BackBtn>
        <Title>Կարգավորումներ</Title>
      </TopBar>

      <ProfileCard>
        <AvatarBtn onClick={() => fileRef.current?.click()} aria-label="Փոխել ավատարը">
          {avatarUrl ? <AvatarImg src={avatarUrl} alt="" /> : (user?.name?.[0]?.toUpperCase() || 'C')}
          {uploading ? <AvatarOverlay>…</AvatarOverlay> : <AvatarEditBadge>📷</AvatarEditBadge>}
        </AvatarBtn>
        <HiddenInput ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} />
        <div>
          <ProfileName>{user?.name || 'Առաքիչ'}</ProfileName>
          <ProfileRole>Առաքիչ</ProfileRole>
        </div>
      </ProfileCard>

      <SectionLabel>Պրոֆիլ</SectionLabel>
      <InfoCard>
        <InfoRow>
          <InfoKey>👤 Անուն</InfoKey>
          <InfoValue>{user?.name || '—'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoKey>📞 Հեռախոս</InfoKey>
          <InfoValue>{user?.phone || '—'}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoKey>✉️ Էլ. փոստ</InfoKey>
          <InfoValue>{user?.email || '—'}</InfoValue>
        </InfoRow>
      </InfoCard>

      <LogoutBtn onClick={() => { logout(); navigate('/login'); }}>
        🚪 Դուրս գալ
      </LogoutBtn>
    </Page>
  );
}
