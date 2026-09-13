import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  "aria-hidden": true,
};

export const IconSearch = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconHeart = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <svg {...base} {...rest} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
    </svg>
  );
};

export const IconUser = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20c.7-3.6 3.6-5.6 7.2-5.6s6.5 2 7.2 5.6" />
  </svg>
);

export const IconBag = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 7.5h14l-1 12.5H6L5 7.5Z" />
    <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12h15" />
    <path d="m13.5 6.5 6 5.5-6 5.5" />
  </svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 12H5" />
    <path d="m10.5 6.5-6 5.5 6 5.5" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 9.5 6 5.5 6-5.5" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9.5 6 5.5 6-5.5 6" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </svg>
);

export const IconInfo = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.4" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 4.5 21 19.5H3L12 4.5Z" />
    <path d="M12 10v4M12 16.8v.4" />
  </svg>
);

export const IconTruck = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2.5 7h11v9h-11z" />
    <path d="M13.5 10.5H18l3 3.2V16h-7.5z" />
    <circle cx="6.5" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </svg>
);

export const IconStore = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 10v10h16V10" />
    <path d="M3 6.5h18L20 10H4L3 6.5Z" />
    <path d="M10 20v-5.5h4V20" />
  </svg>
);

export const IconStar = (p: IconProps & { filled?: boolean }) => {
  const { filled = true, ...rest } = p;
  return (
    <svg {...base} {...rest} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.25}>
      <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8L12 3.8Z" />
    </svg>
  );
};

export const IconPlus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6l7-2.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const IconSparkle = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z" />
    <path d="M18.5 16.2c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" />
  </svg>
);

export const IconRuler = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="8.5" width="19" height="7" />
    <path d="M6.5 8.5v3M10.5 8.5v4.5M14.5 8.5v3M18.5 8.5v4.5" />
  </svg>
);

export const IconRefresh = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20.5 4v4.5H16" />
  </svg>
);

export const IconPin = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </svg>
);

export const IconPhone = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7C11.4 18.7 5.3 12.6 4.8 5.3 4.7 4.3 5.5 3.5 6.5 3.5Z" />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="12" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

/* ------------------------------------------------------------------ admin -- */

export const IconGrid = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" />
    <rect x="13.5" y="3.5" width="7" height="7" />
    <rect x="3.5" y="13.5" width="7" height="7" />
    <rect x="13.5" y="13.5" width="7" height="7" />
  </svg>
);

export const IconList = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />
  </svg>
);

export const IconBox = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8L12 3.5Z" />
    <path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" />
  </svg>
);

export const IconScan = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3M20 8.5V5.5A1.5 1.5 0 0 0 18.5 4h-3M4 15.5v3A1.5 1.5 0 0 0 5.5 20h3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3" />
    <path d="M3.5 12h17" />
  </svg>
);

export const IconWrench = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M15.5 3.5a5 5 0 0 0-4.4 7.3L3.8 18.1a1.8 1.8 0 0 0 2.5 2.5l7.3-7.3A5 5 0 1 0 15.5 3.5Z" />
  </svg>
);

export const IconTag = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M11.5 3.5H20v8.5l-8.7 8.7a1.5 1.5 0 0 1-2.1 0l-6.4-6.4a1.5 1.5 0 0 1 0-2.1L11.5 3.5Z" />
    <circle cx="16.2" cy="7.8" r="1.2" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6M18 14.9c2.1.6 3.4 2.2 3.9 4.6" />
  </svg>
);

export const IconChart = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16.5v-4M12.5 16.5V8M17 16.5v-6.5" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4M17.9 17.9l-1.4-1.4M7.5 7.5 6.1 6.1" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M18 9.5a6 6 0 0 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M10.3 19.5a2 2 0 0 0 3.4 0" />
  </svg>
);

export const IconFilter = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 5.5h17l-6.5 7.5v6l-4 2v-8L3.5 5.5Z" />
  </svg>
);

export const IconMore = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconDownload = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17v2.5h16V17" />
  </svg>
);

export const IconPrinter = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 8.5V3.5h10v5" />
    <rect x="3.5" y="8.5" width="17" height="7" />
    <path d="M7 13.5h10v7H7z" />
  </svg>
);

export const IconQr = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" />
    <rect x="14" y="3.5" width="6.5" height="6.5" />
    <rect x="3.5" y="14" width="6.5" height="6.5" />
    <path d="M14 14h3v3h-3zM20.5 14v3M17.5 20.5h3M14 20.5h.01" />
  </svg>
);

export const IconPanel = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" />
    <path d="M9.5 4.5v15" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10 4.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M15.5 8.5 19.5 12l-4 3.5M19 12H9.5" />
  </svg>
);

export const IconSwap = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
  </svg>
);

export const IconCommand = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 6.5a2.5 2.5 0 1 0-2.5 2.5H9V6.5ZM15 6.5A2.5 2.5 0 1 1 17.5 9H15V6.5ZM9 17.5A2.5 2.5 0 1 1 6.5 15H9v2.5ZM15 17.5a2.5 2.5 0 1 0 2.5-2.5H15v2.5Z" />
    <rect x="9" y="9" width="6" height="6" />
  </svg>
);

export const IconCamera = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 8h3l1.5-2.5h8L17.5 8h3v11.5h-17z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
