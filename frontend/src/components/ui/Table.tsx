import React from 'react';
import './Table.css';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: keyof T | ((row: T) => string);
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  onRowClick,
  rowKey = 'id',
  className = ''
}: TableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(row);
    return String(row[rowKey] ?? index);
  };

  const getCellValue = (row: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(row[column.key], row, index);
    }
    return row[column.key];
  };

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead className="table-head">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`table-th ${col.align ? `text-${col.align}` : ''}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="table-loading">
                <div className="table-loading-content">
                  <div className="spinner" />
                  <span>Carregando...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                <div className="table-empty-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" />
                  </svg>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={`table-row ${onRowClick ? 'table-row-clickable' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`table-td ${col.align ? `text-${col.align}` : ''}`}
                  >
                    {getCellValue(row, col, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Pagination Component
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => 
    p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <div className={`pagination ${className}`}>
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      {visiblePages.map((page, index) => {
        const prevPage = visiblePages[index - 1];
        const showEllipsis = prevPage && page - prevPage > 1;
        
        return (
          <React.Fragment key={page}>
            {showEllipsis && <span className="pagination-ellipsis">...</span>}
            <button
              className={`pagination-btn ${page === currentPage ? 'pagination-btn-active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </React.Fragment>
        );
      })}
      
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};

export default Table;
