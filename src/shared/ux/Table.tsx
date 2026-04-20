import {type Column, DataGrid} from 'react-data-grid';
import {useEffect, useState} from 'react';
import styled from 'styled-components';

export interface Employee {
  ID: number;
  Head_ID: number;
  FirstName: string;
  LastName: string;
  Position: string;
  BirthDate: string;
  HireDate: string;
  Title: string;
  Address: string;
  City: string;
  State: string;
  Zipcode: number;
  Email: string;
  Skype: string;
  HomePhone: string;
  DepartmentID: number;
  Department: string;
  MobilePhone: string;
}

const GridWrapper = styled.div`
    width: 100%;
    min-width: 0;
    overflow-x: auto;

    .rdg {
        border-radius: 18px;
        overflow-x: auto;
        min-width: 100%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .rdg-header-row {
        background: rgba(210, 210, 210, 0.04);
    }

    .rdg-header-cell {
        color: #f8fbff;
        font-weight: 700;
    }

    .rdg-row:hover {
        background: rgba(14, 1, 1, 0.06);
    }

    .rdg-cell {
        color: rgba(255, 255, 255, 0.82);
    }
`;

interface Row {
  id: number;
  title: string;
}


const defaultRows: readonly Row[] = [
  { id: 0, title: 'Example' },
  { id: 1, title: 'Demo' }
];

const defaultColumns: readonly Column<Row>[] = [
  { key: 'id', name: 'ID', resizable: true, draggable: true },
  { key: 'title', name: 'Title', resizable: true, draggable: true }
];

interface TableProps<R> {
  rows?: readonly R[];
  columns?: readonly Column<R>[];
  className?: string;
  onColumnsReorder?: (sourceKey: string, targetKey: string) => void;
  onColumnResize?: (column: Column<R>, width: number) => void;
}

export const Table = <R extends object = Row>({
  rows,
  columns,
  className,
  onColumnsReorder,
  onColumnResize,
}: TableProps<R>) => {
  const [columnState, setColumnState] = useState<readonly Column<R>[]>(
    columns ?? (defaultColumns as unknown as readonly Column<R>[])
  );

  const renderedRows = rows ?? (defaultRows as readonly R[]);

  useEffect(() => {
    if (columns) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumnState(columns);
    }
  }, [columns]);

  function handleColumnsReorder(sourceKey: string, targetKey: string) {
    const sourceIndex = columnState.findIndex((c) => c.key === sourceKey);
    const targetIndex = columnState.findIndex((c) => c.key === targetKey);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextColumns = [...columnState];
    const [moved] = nextColumns.splice(sourceIndex, 1);
    nextColumns.splice(targetIndex, 0, moved);

    setColumnState(nextColumns);
    onColumnsReorder?.(sourceKey, targetKey);
  }

  function handleColumnResize(column: Column<R>, width: number) {
    const idx = columnState.findIndex((c) => c.key === column.key);
    if (idx === -1) return;

    const nextColumns = [...columnState];
    nextColumns[idx] = { ...nextColumns[idx], width };
    setColumnState(nextColumns);
    onColumnResize?.(column, width);
  }

  return (
    <GridWrapper className={className}>
      <DataGrid
        columns={columnState}
        rows={renderedRows}
        onColumnsReorder={handleColumnsReorder}
        onColumnResize={handleColumnResize}
      />
    </GridWrapper>
  );
};

