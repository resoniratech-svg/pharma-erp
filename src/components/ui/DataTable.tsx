import React, { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface DataTableProps extends HTMLAttributes<HTMLTableElement> {
  columns: React.ReactNode[];
  data: React.ReactNode[][];
}

export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(
  ({ className, columns, data, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto rounded-md border border-slate-200 bg-white">
        <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props}>
          <thead className="bg-slate-50 [&_tr]:border-b">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="h-10 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No results.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      {cell}
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
);
DataTable.displayName = 'DataTable';
