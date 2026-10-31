import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  searchable = true,
  searchFields = [],
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  onRowClick,
  headerActions,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter records based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchable) return data;
    const q = searchQuery.toLowerCase();

    return data.filter((row) => {
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = row[field];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      }
      // Default: inspect all column accessors
      return columns.some((col) => {
        if (typeof col.accessor === 'function') {
          const val = col.accessor(row);
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        }
        if (col.accessor) {
          const val = row[col.accessor];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchable, searchFields, columns]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  return (
    <div>
      {(searchable || headerActions) && (
        <div className="filter-bar">
          {searchable ? (
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-control"
              />
            </div>
          ) : (
            <div />
          )}

          {headerActions && <div className="page-actions">{headerActions}</div>}
        </div>
      )}

      {loading ? (
        <div className="table-container">
          <LoadingSpinner text="Fetching data..." />
        </div>
      ) : totalItems === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={col.key || idx}
                      style={{ width: col.width }}
                      className={col.align ? `text-${col.align}` : ''}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIdx) => (
                  <tr
                    key={row.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.key || colIdx}
                        className={col.align ? `text-${col.align}` : ''}
                      >
                        {col.render
                          ? col.render(row, rowIdx)
                          : typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
              }}
            >
              <div>
                Showing {(validCurrentPage - 1) * pageSize + 1} to{' '}
                {Math.min(validCurrentPage * pageSize, totalItems)} of {totalItems} results
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DataTable;
