import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { useAuth } from '../../app/providers/AuthProvider';

const expand = keyframes`
  from { width: 80px; }
  to { width: 280px; }
`;

const collapse = keyframes`
  from { width: 280px; }
  to { width: 80px; }
`;

const SidebarRoot = styled.aside<{ open: boolean }>`
  position: absolute;
  top: 20px;
  left: 0;
  z-index: 100;
  width: ${({ open }) => (open ? '280px' : '80px')};
  min-width: ${({ open }) => (open ? '280px' : '80px')};
  max-width: ${({ open }) => (open ? '280px' : '80px')};
  height: calc(100vh - 40px);
  padding: 28px 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 9, 13, 0.78);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-radius: 24px;
  overflow: hidden;
  transition: width 220ms ease;
  animation: ${({ open }) => (open ? css`${expand} 220ms ease forwards` : css`${collapse} 220ms ease forwards`)};
`;

const Brand = styled.div<{ open: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: ${({ open }) => (open ? 1 : 0)};
  transition: opacity 180ms ease;
`;

const BrandTitle = styled.h1`
  font-size: 1.4rem;
  letter-spacing: 0.05em;
  margin: 0;
`;

const NavList = styled.nav`
  display: grid;
  gap: 10px;
`;

const NavItem = styled(NavLink)<{ open: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.74);
  text-decoration: none;
  font-weight: 600;
  transition: background 150ms ease, color 150ms ease;
  min-width: ${({ open }) => (open ? 'auto' : '0')};
    &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
  &.active {
    color: #f7f7ff;
    background: rgba(76, 160, 255, 0.17);
    padding-left:${({ open }) => (open ? '' : '12px')};
  }
`;

const ItemLabel = styled.span<{ open: boolean }>`
  white-space: nowrap;
  opacity: ${({ open }) => (open ? 1 : 0)};
  width: ${({ open }) => (open ? 'auto' : '0')};
  overflow: hidden;
  transition: opacity 180ms ease, width 180ms ease;
`;

const ItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 26px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #a7b1ff;
`;

const Footer = styled.div`
  margin-top: auto;
  display: grid;
  gap: 14px;
`;

const FooterLabel = styled.span<{ open: boolean }>`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: ${({ open }) => (open ? 1 : 0)};
  width: ${({ open }) => (open ? 'auto' : '0')};
  overflow: hidden;
  transition: opacity 180ms ease, width 180ms ease;
`;

const FooterAction = styled.button<{ open: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  width: 100%;
  border-radius: 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.74);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
  }
`;

const settingsItems = [
  {
    to: '/settings',
    label: 'Կարգավորումներ',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8.94 3.07a9.77 9.77 0 0 0-.43-1.79l-2.14-.63a7.03 7.03 0 0 0-.42-1.02l1.3-1.74a9.9 9.9 0 0 0-1.56-1.56l-1.74 1.3a7.03 7.03 0 0 0-1.02-.42l-.63-2.14A9.77 9.77 0 0 0 12.93 3h-1.86a9.77 9.77 0 0 0-1.79.43l-.63 2.14a7.03 7.03 0 0 0-1.02.42L5.29 4.69A9.9 9.9 0 0 0 3.73 6.25l1.3 1.74c-.18.32-.33.66-.42 1.02l-2.14.63c-.26.7-.43 1.45-.43 1.79v1.86c0 .34.17 1.09.43 1.79l2.14.63c.09.36.24.7.42 1.02l-1.3 1.74a9.9 9.9 0 0 0 1.56 1.56l1.74-1.3c.32.18.66.33 1.02.42l.63 2.14c.7.26 1.45.43 1.79.43h1.86c.34 0 1.09-.17 1.79-.43l.63-2.14c.36-.09.7-.24 1.02-.42l1.74 1.3a9.9 9.9 0 0 0 1.56-1.56l-1.3-1.74c.18-.32.33-.66.42-1.02l2.14-.63c.26-.7.43-1.45.43-1.79v-1.86Z" />
      </svg>
    ),
  },
];

const menuItems = [
  {
    to: '/',
    label: 'Պատվերներ',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M4 4h16v2H4V4Zm0 4h16v2H4V8Zm0 4h10v2H4v-2Zm0 4h10v2H4v-2Zm12 0h4v2h-4v-2Zm0-4h4v2h-4v-2Z" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    label: 'Վահանակ',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-18v5h6V2h-6Z" />
      </svg>
    ),
  },
  {
    to: '/couriers',
    label: 'Առաքիչներ',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M3 18h2v2H3v-2Zm4 0h2v2H7v-2Zm12.5-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9.45-6.96-1.64 4.59H8.33L7.11 8.2C7 7.75 6.55 7.44 6.08 7.5L4 7.88V6h2.28l.94-2.1A1.49 1.49 0 0 1 9.49 2h7.87a1.5 1.5 0 0 1 1.41.92l1.78 4.57a1.5 1.5 0 0 1-.6 1.98Z" />
      </svg>
    ),
  },
  {
    to: '/restaurants',
    label: 'Ռեստորաններ',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M4 6h16v2H4V6Zm0 4h16v2H4v-2Zm0 4h10v2H4v-2Zm0 4h10v2H4v-2Zm12-12h4v2h-4V6Zm0 4h4v2h-4v-2Zm0 4h4v2h-4v-2Z" />
      </svg>
    ),
  },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarRoot
      open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Brand open={open}>
        <BrandTitle>OrderCenter</BrandTitle>
      </Brand>

      <NavList>
        {menuItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            open={open}
            end={item.to === '/'}
            title={item.label}
          >
            <ItemIcon>{item.icon}</ItemIcon>
            <ItemLabel open={open}>{item.label}</ItemLabel>
          </NavItem>
        ))}
      </NavList>

      <Footer>
        <FooterLabel open={open}>Կարգավորումներ</FooterLabel>
        <NavList>
          {settingsItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              open={open}
              title={item.label}
            >
              <ItemIcon>{item.icon}</ItemIcon>
              <ItemLabel open={open}>{item.label}</ItemLabel>
            </NavItem>
          ))}
          <FooterAction open={open} onClick={handleLogout} type="button" title="Ելք">
            <ItemIcon>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M16 13v-2H7V8l-5 4 5 4v-3h9Zm3-10H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
              </svg>
            </ItemIcon>
            <ItemLabel open={open}>Ելք</ItemLabel>
          </FooterAction>
        </NavList>
      </Footer>
    </SidebarRoot>
  );
};
