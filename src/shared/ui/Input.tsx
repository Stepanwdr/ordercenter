import styled from 'styled-components';

const StyledInput = styled.input`
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.colors.text};
  border-radius: 14px;
  padding: 14px 16px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
  &:focus {
    border-color: rgba(79, 143, 255, 0.9);
    box-shadow: 0 0 0 4px rgba(79, 143, 255, 0.12);
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.42);
  }
`;

export const Input = styled(StyledInput)``;
