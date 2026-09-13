"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { DataTable, type Column, type Density } from "@/components/ui/DataTable";
import { IconPlus, IconTag } from "@/components/ui/Icons";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { EmptyState, Meter, MoreMenu, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { UNITS } from "@/data/operations";
import { CATEGORIES, getCategory } from "@/data/catalog";
import { PRODUCTS } from "@/data/products";
import { formatVnd } from "@/lib/money";
import { fromPricePerDay, minDeposit } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

export default function ProductsPage() {
  const router = useRouter();
  const session = useSession();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [density, setDensity] = useState<Density>("comfortable");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(id);
  }, [search, category]);

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; available: number }>();
    for (const u of UNITS) {
      const cur = map.get(u.productSlug) ?? { total: 0, available: 0 };
      cur.total += 1;
      if (u.status === "available") cur.available += 1;
      map.set(u.productSlug, cur);
    }
    return map;
  }, []);

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return PRODUCTS.filter((p) => {
      if (category !== "all" && p.categorySlug !== category) return false;
      if (q && !deaccent(`${p.name} ${p.sku} ${p.brandLine}`).includes(q)) return false;
      return true;
    });
  }, [search, category]);

  if (!session.can("catalog.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconTag width={22} height={22} />}
          title="Bạn không có quyền quản lý catalog"
          body="Sửa sản phẩm, biến thể và bảng giá là quyền của Quản lý và Admin. Bạn vẫn tra cứu được sản phẩm qua ô tìm kiếm toàn hệ thống."
        />
      </div>
    );
  }

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Sản phẩm",
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <ProductMedia thumb image={p.images[0]} ratio="1/1" className="h-9 w-9 shrink-0 rounded" />
          <div className="min-w-0">
            <p className="truncate text-[12.5px]">{p.name}</p>
            <p data-row-detail className="num truncate text-[11px] text-ink-3">
              {p.sku} · {p.brandLine}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Danh mục",
      width: "150px",
      hideBelow: "md",
      sortValue: (p) => p.categorySlug,
      render: (p) => <span className="text-[12px] text-ink-2">{getCategory(p.categorySlug)?.name}</span>,
    },
    {
      key: "variants",
      header: "Biến thể",
      align: "right",
      width: "84px",
      sortValue: (p) => p.variants.length,
      render: (p) => <span className="num text-[12.5px]">{p.variants.length}</span>,
    },
    {
      key: "price",
      header: "Giá thuê / ngày",
      align: "right",
      width: "130px",
      sortValue: (p) => fromPricePerDay(p.variants),
      render: (p) => <span className="num text-[12.5px]">{formatVnd(fromPricePerDay(p.variants))}</span>,
    },
    {
      key: "deposit",
      header: "Cọc",
      align: "right",
      width: "120px",
      hideBelow: "lg",
      sortValue: (p) => minDeposit(p.variants),
      render: (p) => <span className="num text-[12.5px] text-ink-2">{formatVnd(minDeposit(p.variants))}</span>,
    },
    {
      key: "units",
      header: "Cá thể sẵn sàng",
      width: "160px",
      hideBelow: "lg",
      sortValue: (p) => {
        const s = stats.get(p.slug);
        return s ? s.available / Math.max(1, s.total) : 0;
      },
      render: (p) => {
        const s = stats.get(p.slug) ?? { total: 0, available: 0 };
        const pct = s.total ? (s.available / s.total) * 100 : 0;
        return (
          <div>
            <div className="flex items-baseline justify-between text-[11.5px]">
              <span className="num">
                {s.available}/{s.total}
              </span>
              <span className="text-ink-3">{Math.round(pct)}%</span>
            </div>
            <Meter value={pct} tone={pct > 50 ? "success" : pct > 20 ? "warning" : "danger"} />
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "110px",
      render: (p) => (p.isNew ? <StatusChip tone="info">Mới về</StatusChip> : <StatusChip tone="success">Đang bán</StatusChip>),
    },
    {
      key: "actions",
      header: "",
      width: "102px",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/products/${p.slug}`} className="btn btn-outline btn-sm">
            Sửa
          </Link>
          <MoreMenu
            items={[
              { label: "Xem cá thể của sản phẩm", onSelect: () => router.push(`/inventory?q=${p.sku}`) },
              { label: "Nhân bản sản phẩm", onSelect: () => toast.push({ tone: "info", title: "Đã tạo bản sao nháp" }) },
              { label: "Ngừng cho thuê", danger: true, onSelect: () => toast.push({ tone: "warning", title: "Đã ẩn khỏi catalog khách" }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sản phẩm"
        description="Mỗi sản phẩm có nhiều biến thể size × màu, mỗi biến thể lại gồm nhiều cá thể vật lý. Giá và cọc đặt ở cấp biến thể."
        breadcrumb={[{ label: "Catalog" }, { label: "Sản phẩm" }]}
        actions={
          <Link href="/products/new" className="btn btn-sm gap-1.5">
            <IconPlus width={14} height={14} />
            Thêm sản phẩm
          </Link>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm tên sản phẩm hoặc mã SKU..."
        density={density}
        onDensityChange={setDensity}
        resultLabel={loading ? "Đang tải..." : `${rows.length} sản phẩm`}
        quickFilters={[
          { key: "all", label: "Tất cả", count: PRODUCTS.length },
          ...CATEGORIES.slice(0, 6).map((c) => ({
            key: c.slug,
            label: c.name,
            count: PRODUCTS.filter((p) => p.categorySlug === c.slug).length,
          })),
        ]}
        activeQuick={category}
        onQuickChange={setCategory}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(p) => p.slug}
        density={density}
        loading={loading}
        onRowClick={(p) => router.push(`/products/${p.slug}`)}
        empty={
          <EmptyState
            icon={<IconTag width={22} height={22} />}
            title="Không tìm thấy sản phẩm"
            body="Thử từ khoá ngắn hơn hoặc chọn lại danh mục."
          />
        }
        cardRender={(p) => (
          <div className="flex items-center gap-3">
            <ProductMedia image={p.images[0]} ratio="1/1" className="h-10 w-10 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px]">{p.name}</p>
              <p className="num text-[11.5px] text-ink-3">
                {formatVnd(fromPricePerDay(p.variants))}/ngày · {p.variants.length} biến thể
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
}
