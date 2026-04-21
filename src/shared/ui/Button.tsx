import styled from 'styled-components';
import {forwardRef} from "react";

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' | 'ghost' }>`
  border: none;
  border-radius: 14px;
  min-height: 44px;
  padding: 0 18px;
  color: ${({ variant, theme }) => (variant === 'secondary' ? theme.colors.text : '#fff')};
  background: ${({ variant }) =>
    variant === 'secondary' ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #5d7bff, #34d399)'};
  font-weight: 700;
  transition: transform 120ms ease, opacity 120ms ease;
  box-shadow: 0 8px 35px rgba(16, 24, 64, 0.18);
  backdrop-filter: blur(18px);
  &:hover {
    transform: translateY(-1px);
    opacity: 0.95;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    );
  }
);
