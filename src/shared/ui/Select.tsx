import styled from 'styled-components';

export const Select = styled.select`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: ${({ theme }) => theme.colors.text};
  border-radius: 14px;
  padding: 14px 16px;
  outline: none;
  appearance: none;
  &:focus {
    border-color: rgba(79, 143, 255, 0.9);
    box-shadow: 0 0 0 4px rgba(79, 143, 255, 0.12);
  }
`;
