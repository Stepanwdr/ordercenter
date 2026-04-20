import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    background: '#0c1220',
    surface: 'rgba(18, 24, 44, 0.88)',
    surfaceAlt: 'rgba(25, 32, 61, 0.92)',
    text: '#eef2ff',
    muted: '#8fa0c4',
    success: '#6ad579',
    warning: '#f7b955',
    danger: '#f16b6b',
    info: '#81b6ff',
    border: 'rgba(255,255,255,0.08)',
    gray: '#9ca4ba',
    status: {
      new: '#9ca3ff',
      cooking: '#f59e0b',
      ready: '#38bdf8',
      delivering: '#9d7cff',
      done: '#34d399',
    },
  },
  shadows: {
    soft: '0 24px 60px rgba(10, 14, 30, 0.28)',
  },
};

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
    background: radial-gradient(circle at top left, rgba(86, 106, 244, 0.16), transparent 20%), #05070f;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  button, input, textarea, select {
    font: inherit;
  }
  button { cursor: pointer; }
  a { color: inherit; }
`;
