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
  /**
   * Ẩn cột khi vùng chứa bảng hẹp hơn mốc này.
   *
   * Mốc đo theo *container* (bề rộng thật còn lại sau thanh bên) chứ không theo
   * viewport — vì thanh bên ăn mất 244px, một bảng "vừa" ở viewport 1280px thực
   * ra chỉ có ~996px để vẽ. Quy đổi sang viewport khi thanh bên đang mở:
   *
   *   md  = 448px  →  ~732px viewport
   *   lg  = 512px  →  ~796px
   *   xl  = 576px  →  ~860px
   *   2xl = 672px  →  ~956px
   *   3xl = 768px  → ~1052px
   *   4xl = 896px  → ~1180px
   *   5xl = 1024px → ~1308px
   *   6xl = 1152px → ~1436px
   *   7xl = 1280px → ~1564px
   */
  hideBelow?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
}

const HIDE_CLASS = {
  md: "hidden @md:table-cell",
  lg: "hidden @lg:table-cell",
  xl: "hidden @xl:table-cell",
  "2xl": "hidden @2xl:table-cell",
  "3xl": "hidden @3xl:table-cell",
  "4xl": "hidden @4xl:table-cell",
  "5xl": "hidden @5xl:table-cell",
  "6xl": "hidden @6xl:table-cell",
  "7xl": "hidden @7xl:table-cell",
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
      <div className={cn("overflow-x-auto", cardRender && "hidden @2xl:block")} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
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
        <ul className="divide-y divide-line @2xl:hidden">
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
