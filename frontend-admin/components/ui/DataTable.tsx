"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "./Icons";
import { EmptyState, TableSkeleton } from "./Primitives";

export type Density = "comfortable" | "compact";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Giá trị dùng để sắp xếp; bỏ trống nghĩa là cột không sắp xếp được */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
  /** Ẩn cột dưới breakpoint này để bảng không vỡ trên tablet */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const HIDE_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

export function DataTable<T>({
  columns,
  rows,
  getKey,
  density = "comfortable",
  loading,
  empty,
  onRowClick,
  selectable,
  selected,
  onSelectedChange,
  bulkBar,
  initialSort,
  maxHeight,
  cardRender,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  density?: Density;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (next: string[]) => void;
  bulkBar?: (selected: string[], clear: () => void) => ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  maxHeight?: string;
  /** Bố cục thẻ cho mobile — khi bảng quá rộng để dùng được */
  cardRender?: (row: T) => ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "vi");
      return sort.dir === "asc" ? r : -r;
    });
    return copy;
  }, [rows, sort, columns]);

  const allKeys = sorted.map(getKey);
  const allSelected = selectable && selected && selected.length > 0 && selected.length === allKeys.length;

  function toggleRow(key: string) {
    if (!selected || !onSelectedChange) return;
    onSelectedChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <TableSkeleton cols={Math.min(columns.length, 7)} />
      </div>
    );
  }

  if (sorted.length === 0) {
    return <div className="card overflow-hidden">{empty ?? <EmptyState title="Không có dữ liệu" body="Chưa có bản ghi nào khớp điều kiện hiện tại." />}</div>;
  }

  return (
    <div className="card overflow-hidden">
      {selectable && selected && selected.length > 0 && bulkBar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-beige px-3 py-2">
          <span className="text-[12.5px]">Đã chọn {selected.length} dòng</span>
          {bulkBar(selected, () => onSelectedChange?.([]))}
        </div>
      )}

      {/* Bảng — desktop & tablet */}
      <div className={cn("overflow-x-auto", cardRender && "hidden md:block")} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <table className={cn("tbl", density === "compact" && "tbl-compact")}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả"
                    checked={Boolean(allSelected)}
                    onChange={() => onSelectedChange?.(allSelected ? [] : allKeys)}
                    className="h-3.5 w-3.5 accent-[#181818]"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue);
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(col.align === "right" && "text-right", col.hideBelow && HIDE_CLASS[col.hideBelow])}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort(
                            active
                              ? { key: col.key, dir: sort!.dir === "asc" ? "desc" : "asc" }
                              : { key: col.key, dir: "asc" },
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-ink",
                          col.align === "right" && "flex-row-reverse",
                          active && "text-ink",
                        )}
                      >
                        {col.header}
                        <IconChevronDown
                          width={12}
                          height={12}
                          className={cn(
                            "transition-transform duration-150",
                            active ? (sort!.dir === "asc" ? "rotate-180" : "") : "opacity-0",
                          )}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const key = getKey(row);
              const isSelected = selected?.includes(key);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer", isSelected && "bg-beige/60")}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${key}`}
                        checked={Boolean(isSelected)}
                        onChange={() => toggleRow(key)}
                        className="h-3.5 w-3.5 accent-[#181818]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align === "right" && "text-right",
                        col.hideBelow && HIDE_CLASS[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thẻ — mobile */}
      {cardRender && (
        <ul className="divide-y divide-line md:hidden">
          {sorted.map((row) => (
            <li
              key={getKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("px-3.5 py-3", onRowClick && "cursor-pointer")}
            >
              {cardRender(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
