import { Button } from '@shared/ui/Button';

export const SendOrderAction = ({ onSend }: { onSend: () => void }) => (
  <Button variant="secondary" onClick={onSend}>
    Ողարկել պատվեր
  </Button>
);
