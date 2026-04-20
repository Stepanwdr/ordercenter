import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      surface: string;
      surfaceAlt: string;
      text: string;
      muted: string;
      success: string;
      warning: string;
      danger: string;
      info: string;
      border: string;
      gray: string;
      status: Record<string, string>;
    };
    shadows: {
      soft: string;
    };
  }
}
