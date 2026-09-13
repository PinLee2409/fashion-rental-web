"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEscape, useLockBodyScroll, useMounted } from "@/hooks";
import { cn } from "@/lib/utils";
import { IconClose } from "./Icons";

function Portal({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function Scrim({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Đóng"
      onClick={onClick}
      className="animate-fade fixed inset-0 z-40 cursor-default bg-ink/35 backdrop-blur-[2px]"
    />
  );
}

/** Ngăn kéo trượt từ phải — giỏ thuê, bộ lọc trên tablet. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = "right",
  width = "max-w-[460px]",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
  width?: string;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <Scrim onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-slide-left fixed inset-y-0 z-50 flex w-full flex-col bg-canvas",
          width,
          side === "right" ? "right-0" : "left-0",
        )}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-line px-6 py-5">
            <div className="eyebrow">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="-mr-2 p-2 text-ink-2 transition-colors hover:text-ink"
            >
              <IconClose />
            </button>
          </header>
        )}
        <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-6 py-5">{footer}</div>}
      </aside>
    </Portal>
  );
}

/** Bottom sheet cho mobile — chọn ngày, bộ lọc, cấu hình thuê. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <Scrim onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        className="animate-sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col bg-canvas"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="eyebrow">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 p-2 text-ink-2 transition-colors hover:text-ink"
          >
            <IconClose />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </section>
    </Portal>
  );
}

/** Hộp thoại giữa màn hình — xác nhận huỷ đơn, gia hạn, đánh giá. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-[560px]",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <Scrim onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "animate-scale-in max-h-[90vh] w-full overflow-y-auto bg-canvas",
            width,
          )}
        >
          {title && (
            <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-5">
              <h2 className="display-4">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="-mr-2 p-2 text-ink-2 transition-colors hover:text-ink"
              >
                <IconClose />
              </button>
            </header>
          )}
          <div className="px-6 py-6">{children}</div>
          {footer && <div className="border-t border-line px-6 py-5">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Lớp phủ toàn màn hình — tìm kiếm, menu mobile. */
export function FullOverlay({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-fade fixed inset-0 z-50 flex flex-col bg-canvas"
      >
        {children}
      </div>
    </Portal>
  );
}
