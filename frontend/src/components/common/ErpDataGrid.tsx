import React, { useState, useMemo } from 'react';
import { RefreshCw, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface ServerPagination {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
}

export interface ErpDataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  selectedId?: string | number | null;
  onSelectRow?: (item: T) => void;
  onDoubleClickRow?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  /**
   * İstemci taraflı sayfalama için varsayılan sayfa boyutu (varsayılan: 25).
   * false verilirse sayfalama kapatılır ve tüm satırlar listelenir.
   */
  defaultPageSize?: number | false;
  /**
   * Sunucu taraflı sayfalama kontrolü (verildiğinde istemci sayfalaması yerine kullanılır).
   */
  pagination?: ServerPagination;
}

export function ErpDataGrid<T>({
  data,
  columns,
  keyExtractor,
  selectedId,
  onSelectRow,
  onDoubleClickRow,
  loading = false,
  emptyMessage = 'Kayıt bulunamadı.',
  maxHeight = 'calc(100vh - 290px)',
  defaultPageSize = 25,
  pagination: serverPagination,
}: ErpDataGridProps<T>) {
  // İstemci taraflı sayfalama durumu
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState<number>(
    typeof defaultPageSize === 'number' ? defaultPageSize : 25
  );

  const isServer = !!serverPagination;
  const isPaginationEnabled = defaultPageSize !== false || isServer;

  // Sayfalanmış veri
  const displayData = useMemo(() => {
    if (isServer || !isPaginationEnabled) {
      return data;
    }
    const startIdx = (clientPage - 1) * clientPageSize;
    return data.slice(startIdx, startIdx + clientPageSize);
  }, [data, isServer, isPaginationEnabled, clientPage, clientPageSize]);

  // Sayfalama metrikleri
  const totalCount = isServer ? serverPagination.totalElements : data.length;
  const activePage = isServer ? serverPagination.page : clientPage;
  const activePageSize = isServer ? serverPagination.pageSize : clientPageSize;
  const totalPages = isServer
    ? serverPagination.totalPages
    : Math.max(1, Math.ceil(data.length / activePageSize));

  const startRecord = totalCount === 0 ? 0 : (activePage - 1) * activePageSize + 1;
  const endRecord = Math.min(activePage * activePageSize, totalCount);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isServer) {
      serverPagination.onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServer && serverPagination.onPageSizeChange) {
      serverPagination.onPageSizeChange(newSize);
    } else {
      setClientPageSize(newSize);
      setClientPage(1);
    }
  };

  return (
    <div className="flex flex-col border border-slate-300 rounded-b-sm bg-white shadow-2xs">
      <div
        className="w-full overflow-auto bg-white select-none relative"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse text-xs text-left">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-200 text-slate-800 border-b border-slate-300 shadow-2xs">
            <tr>
              <th className="w-8 px-2 py-2 text-center border-r border-slate-300 font-bold text-slate-600">
                #
              </th>
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.id}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-2.5 py-2 font-semibold text-[11px] tracking-wide uppercase border-r border-slate-300 whitespace-nowrap ${alignClass} ${
                      col.className || ''
                    }`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-16 text-center text-slate-500 bg-slate-50"
                >
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-700 mb-2" />
                  <span className="text-xs font-medium">Veriler yükleniyor...</span>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-16 text-center text-slate-400 bg-slate-50"
                >
                  <FileText className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  <span className="text-xs font-medium">{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              displayData.map((item, rowIdx) => {
                const rowId = keyExtractor(item);
                const isSelected = selectedId !== undefined && selectedId !== null && selectedId === rowId;
                const actualIndex = startRecord + rowIdx;

                return (
                  <tr
                    key={rowId}
                    onClick={() => onSelectRow && onSelectRow(item)}
                    onDoubleClick={() => onDoubleClickRow && onDoubleClickRow(item)}
                    className={`cursor-pointer transition-colors duration-75 ${
                      isSelected
                        ? 'bg-blue-100/90 text-blue-950 font-medium'
                        : rowIdx % 2 === 1
                        ? 'bg-slate-50/60 hover:bg-slate-100/80'
                        : 'bg-white hover:bg-slate-100/80'
                    }`}
                  >
                    {/* Satır No / Seçim İndikatörü */}
                    <td
                      className={`px-1.5 py-1.5 text-center font-mono text-[10px] border-r border-slate-200 whitespace-nowrap ${
                        isSelected
                          ? 'border-l-4 border-l-blue-600 bg-blue-200/60 text-blue-900 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? '▶' : actualIndex}
                    </td>

                    {/* Veri Hücreleri */}
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      let cellContent: React.ReactNode = null;
                      if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(item);
                      } else if (col.accessor) {
                        cellContent = (item[col.accessor] as any)?.toString() ?? '';
                      }

                      return (
                        <td
                          key={col.id}
                          className={`px-2.5 py-1.5 border-r border-slate-200 align-middle ${alignClass} ${
                            col.className || ''
                          }`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Kurumsal Sayfalama Çubuğu (Pagination Footer) */}
      {isPaginationEnabled && (
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-100 border-t border-slate-300 text-[11px] text-slate-600 select-none">
          {/* Sol: Kayıt Bilgisi */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Toplam {totalCount} kayıt</span>
            {totalCount > 0 && (
              <span className="text-slate-500 font-mono">
                ({startRecord}-{endRecord} gösteriliyor)
              </span>
            )}
          </div>

          {/* Sağ: Sayfa Kontrolleri & Boyut Seçici */}
          <div className="flex items-center gap-3">
            {/* Sayfa Başı Kayıt */}
            <div className="flex items-center gap-1.5">
              <span>Sayfa Başı:</span>
              <select
                value={activePageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-6 px-1 text-[11px] bg-white border border-slate-300 rounded-xs text-slate-700 focus:outline-none focus:border-slate-500 font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Sayfa Değiştirme Butonları */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={activePage <= 1}
                title="İlk Sayfa"
                className="p-1 rounded-xs hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                title="Önceki Sayfa"
                className="p-1 rounded-xs hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded-xs font-mono font-medium text-slate-800 text-[11px]">
                {activePage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage >= totalPages}
                title="Sonraki Sayfa"
                className="p-1 rounded-xs hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={activePage >= totalPages}
                title="Son Sayfa"
                className="p-1 rounded-xs hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
