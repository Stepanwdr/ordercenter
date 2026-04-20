import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { Button } from '@shared/ui/Button';

type DropdownOption = {
  value: string;
  label: string;
};

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  label?: string;
  asTableCell?: boolean
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
`;

const Menu = styled.div<{ top: number; left: number; width: number }>`
    position: absolute;
    top: ${({top}) => top}px;
    left: ${({left}) => left}px;
    width: ${({width}) => width}px;
    background: rgb(17, 19, 24);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    box-shadow: 0 28px 40px rgba(55, 55, 55, 0.1);
    overflow: hidden;
    animation: ${fadeIn} 180ms ease;
`;

const Item = styled.button<{ selected?: boolean }>`
  width: 100%;
  min-height: 46px;
  padding: 12px 16px;
  text-align: left;
  color: ${({ selected }) => (selected ? '#fff' : 'rgba(255, 255, 255, 0.8)')};
  background: ${({ selected }) => (selected ? 'rgba(79, 143, 255, 0.18)' : 'transparent')};
  border: none;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Trigger = styled(Button)<{ $asTableCell?:boolean }>`
  justify-content: space-between;
  display: flex;
  align-items: center;
  min-width: unset;
  min-height: ${({ $asTableCell }) => ($asTableCell ? '25px' : '50px')};
  height: 100%;
 `;

const Label = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LabelText = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

export const Dropdown = ({ value, options, placeholder = 'Select', onChange, label, asTableCell }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? placeholder,
    [options, value, placeholder]
  );
  useEffect(() => {
    if (!open) return;
    const node = buttonRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (node.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    console.log({ option }, 'sd');
    setOpen(false);
  };

  return (
    <Label>
      {label && <LabelText>{label}</LabelText>}
      <Trigger $asTableCell={asTableCell} ref={buttonRef} type="button" variant="secondary" onClick={() => setOpen(prev => !prev)}>
        <span>{selectedLabel}</span>
        <span>{open ? '▴' : '▾'}</span>
      </Trigger>
      {open &&
        createPortal(
          <Overlay>
            <Menu ref={menuRef} top={position.top} left={position.left} width={position.width}>
              {options.map((option) => (
                <Item
                  key={option.value}
                  type="button"
                  selected={option.value === value}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </Item>
              ))}
            </Menu>
          </Overlay>,
          document.body
        )}
    </Label>
  );
};
