import type { ReactNode } from "react";

type IconName =
  | "wave" | "upload" | "music" | "sparkles" | "check" | "arrow-right" | "arrow-left"
  | "file" | "replace" | "trash" | "copy" | "download" | "clock" | "globe" | "alert"
  | "refresh" | "spinner" | "lock" | "transcript" | "summary" | "chevron" | "info";

const artwork: Record<IconName, ReactNode> = {
  wave: <><path d="M3 10v4M7 6v12m4-15v18m4-14v10m4-14v18m4-13v8" /></>,
  upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.8 1.8L8 5.5l-2.2.7L5 8l-.8-1.8L2 5.5l2.2-.7L5 3Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  "arrow-left": <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
  replace: <><path d="M20 7h-7V2" /><path d="M4 17h7v5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 1m-16 10 2 1a7 7 0 0 0 12.4-3" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  download: <><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" /><path d="M4 20h16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" /></>,
  alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.8 2.5 17.3A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.7L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" /></>,
  spinner: <><path d="M21 12a9 9 0 1 1-5.6-8.3" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" /></>,
  transcript: <><path d="M5 5h14M5 9h14M5 13h10M5 17h8" /><path d="M3 2h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" /></>,
  summary: <><path d="M5 4h14v16H5z" /><path d="M8 8h8m-8 4h8m-8 4h5" /><path d="m17 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {artwork[name]}
    </svg>
  );
}
