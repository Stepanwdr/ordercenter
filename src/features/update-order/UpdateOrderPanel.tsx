import styled from 'styled-components';
import { Button } from '@shared/ui/Button';

const Panel = styled.div`
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const UpdateOrderPanel = ({ onClose }: { onClose: () => void }) => (
  <Panel>
    <h2>Թարմացնել պատվեր</h2>
    <p>Օնտրել աջթ տափա և Պահել մոդաւանումռ արզաց պատվերի համար:</p>
    <Button onClick={onClose}>Փակել</Button>
  </Panel>
);
