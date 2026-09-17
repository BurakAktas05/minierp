import React from 'react';

/**
 * ============================================================================
 * MiniERP - Table (Tablo) Bileşen Ailesi
 * ============================================================================
 * Kullanım Örneği:
 * 
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Kod</TableHead>
 *       <TableHead>Ad</TableHead>
 *       <TableHead className="text-right">Tutar</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     {items.map(item => (
 *       <TableRow key={item.id}>
 *         <TableCell className="font-mono">{item.code}</TableCell>
 *         <TableCell>{item.name}</TableCell>
 *         <TableCell className="text-right">₺{item.price}</TableCell>
 *       </TableRow>
 *     ))}
 *   </TableBody>
 * </Table>
 */

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
    <table className={`w-full caption-bottom text-sm text-left border-collapse ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <thead className={`bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tr className={`transition-colors hover:bg-slate-50/75 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <th className={`h-10 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <td className={`p-3.5 align-middle text-slate-800 text-sm ${className}`} {...props}>
    {children}
  </td>
);
