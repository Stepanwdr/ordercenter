import styled from 'styled-components';
import {Button} from "@shared/ui/Button.tsx";

const PaginationRoot = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 18px;
`;

const PageButton = styled(Button)<{ active?: boolean }>`
  min-width: 42px;
  padding: 10px 14px;
  border-radius: 14px;
  background: ${({ active }) => (active ? 'rgba(79, 143, 255, 0.95)' : 'rgba(255, 255, 255, 0.04)')};
  color: ${({ active }) => (active ? '#fff' : 'rgba(255, 255, 255, 0.85)')};
  border: 1px solid rgba(255, 255, 255, 0.08);
  &:hover {
    background: ${({ active }) => (active ? 'rgba(79, 143, 255, 0.95)' : 'rgba(255, 255, 255, 0.08)')};
  }
`;

const Summary = styled.div`
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.92rem;
`;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onChange }: PaginationProps) => {
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <PaginationRoot>
      <Summary>Page {currentPage} of {totalPages}</Summary>
      <PageButton type="button" variant="secondary" onClick={() => onChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        Prev
      </PageButton>
      {pages.map((page) => (
        <PageButton key={page} type="button" variant="secondary" active={page === currentPage} onClick={() => onChange(page)}>
          {page}
        </PageButton>
      ))}
      <PageButton type="button" variant="secondary" onClick={() => onChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
        Next
      </PageButton>
    </PaginationRoot>
  );
};
