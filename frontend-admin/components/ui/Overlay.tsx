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

function Scrim({ onClick, soft }: { onClick: () => void; soft?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Đóng"
      onClick={onClick}
      className={cn(
        "a-fade fixed inset-0 z-40 cursor-default",
        soft ? "bg-ink/12" : "bg-ink/28",
      )}
    />
  );
}

/**
 * Drawer phải — dùng để soi nhanh một thực thể mà không rời trang hiện tại.
 * Nền phía sau chỉ mờ nhẹ để vẫn thấy ngữ cảnh vận hành.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-[520px]",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <Scrim onClick={onClose} soft />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "a-drawer fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-canvas shadow-[-16px_0_40px_-24px_rgba(0,0,0,0.25)]",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-3.5">
          <div className="min-w-0">
            <div className="text-[14px] font-medium">{title}</div>
            {subtitle && <div className="mt-0.5 text-[12px] text-ink-2">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="btn btn-ghost btn-sm btn-icon">
            <IconClose width={16} height={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-surface px-5 py-3">{footer}</div>}
      </aside>
    </Portal>
  );
}

/** Modal — chỉ dùng cho tác vụ ngắn, có trọng tâm. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-[520px]",
  tone,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
  tone?: "danger";
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
            "a-pop max-h-[90vh] w-full overflow-y-auto rounded-t-lg border border-line bg-surface shadow-[0_24px_60px_-24px_rgba(0,0,0,0.3)] sm:rounded-lg",
            width,
          )}
        >
          <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
            <div className="min-w-0">
              <h2 className={cn("text-[15px] font-medium", tone === "danger" && "text-danger")}>{title}</h2>
              {description && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="btn btn-ghost btn-sm btn-icon">
              <IconClose width={16} height={16} />
            </button>
          </header>
          {children && <div className="px-5 pb-4">{children}</div>}
          {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

/** Bottom sheet — dùng cho thao tác trên mobile (quét QR, nhận trả). */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
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
        className="a-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-lg border-t border-line bg-canvas"
      >
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <div className="text-[14px] font-medium">{title}</div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="btn btn-ghost btn-sm btn-icon">
            <IconClose width={16} height={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </section>
    </Portal>
  );
}

/** Lớp phủ toàn màn hình — command palette. */
export function CommandOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useLockBodyScroll(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <Portal>
      <Scrim onClick={onClose} />
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[8vh]">
        <div className="a-pop w-full max-w-[620px] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_28px_70px_-28px_rgba(0,0,0,0.4)]">
          {children}
        </div>
      </div>
    </Portal>
  );
}
