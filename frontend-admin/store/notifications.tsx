"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";

/**
 * Trạng thái "đã đọc" của thông báo vận hành.
 *
 * Trước đây state này nằm trong <Header>, nên đọc ở chuông rồi mở trang
 * /notifications là thấy lại y nguyên "chưa đọc". Đưa ra context dùng chung để
 * chuông và trang luôn khớp; bản demo lưu localStorage, hệ thống thật sẽ gọi
 * PATCH /notifications/:id/read.
 */
interface NotificationsValue {
  readIds: string[];
  isRead: (id: string, fallback: boolean) => boolean;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
  markUnread: (id: string) => void;
  hydrated: boolean;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function useNotificationReads(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationReads phải nằm trong <NotificationsProvider>");
  return ctx;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIds, hydrated] = usePersistentState<string[]>("stylerent.admin.notifications.read", []);
  const [unreadIds, setUnreadIds] = usePersistentState<string[]>("stylerent.admin.notifications.unread", []);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setUnreadIds((prev) => prev.filter((x) => x !== id));
    },
    [setReadIds, setUnreadIds],
  );

  const markAllRead = useCallback(
    (ids: string[]) => {
      setReadIds((prev) => [...new Set([...prev, ...ids])]);
      setUnreadIds([]);
    },
    [setReadIds, setUnreadIds],
  );

  /** Đánh dấu lại chưa đọc — để dành việc cho ca sau mà không mất dấu. */
  const markUnread = useCallback(
    (id: string) => {
      setUnreadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setReadIds((prev) => prev.filter((x) => x !== id));
    },
    [setReadIds, setUnreadIds],
  );

  const value = useMemo<NotificationsValue>(
    () => ({
      readIds,
      // `fallback` là cờ `read` sẵn có trong dữ liệu mock.
      isRead: (id, fallback) => (unreadIds.includes(id) ? false : readIds.includes(id) || fallback),
      markRead,
      markAllRead,
      markUnread,
      hydrated,
    }),
    [readIds, unreadIds, markRead, markAllRead, markUnread, hydrated],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
