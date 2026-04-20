import type { FC, PropsWithChildren } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle, theme } from '../styles/global';
import { AuthProvider } from './AuthProvider';

export const Providers: FC<PropsWithChildren> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <AuthProvider>{children}</AuthProvider>
  </ThemeProvider>
);
