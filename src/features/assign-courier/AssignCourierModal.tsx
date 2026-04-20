import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Select } from '@shared/ui/Select';
import { useState } from 'react';

const Panel = styled.div`
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 420px;
`;

export const AssignCourierModal = ({ onAssign, onClose }: { onAssign: (courierId: string) => void; onClose: () => void }) => {
  const [courierId, setCourierId] = useState('c1');
  return (
    <Panel>
      <h2>Եցնել առաքիչ</h2>
      <Select value={courierId} onChange={(e) => setCourierId(e.target.value)}>
        <option value="c1">Nova Kai</option>
        <option value="c2">Maya Ortiz</option>
        <option value="c3">Jin Park</option>
      </Select>
      <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
        <Button onClick={() => onAssign(courierId)}>Եցնել</Button>
        <Button variant="secondary" onClick={onClose}>Չեղարկել</Button>
      </div>
    </Panel>
  );
};
