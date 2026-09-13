"use client";

import { useCallback, useEffect } from "react";

/**
 * Scroll reveal dùng chung: phần tử gắn `data-reveal` sẽ được thêm class
 * `is-revealed` khi lọt vào khung nhìn. Toàn bộ chuyển động do CSS đảm nhiệm
 * (mờ dần + trượt lên 20px, 700ms ease-out-expo).
 */
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
  }
  return observer;
}

function observe(node: Element) {
  const io = getObserver();
  if (!io) {
    node.classList.add("is-revealed");
    return;
  }
  io.observe(node);
}

/** Ref callback cho component <Reveal> — mỗi khối tự đăng ký, kể cả khi render muộn. */
export function useRevealRef() {
  return useCallback((node: HTMLElement | null) => {
    if (!node || node.classList.contains("is-revealed")) return;
    observe(node);
  }, []);
}

/**
 * Quét những phần tử gắn `data-reveal` thủ công (không qua component <Reveal>),
 * kể cả phần tử được thêm vào DOM sau khi trang đã render.
 */
export function useReveal() {
  useEffect(() => {
    const scan = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)")
        .forEach((node) => observe(node));
    };
    scan();

    const mutation = new MutationObserver(scan);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => mutation.disconnect();
  }, []);
}
