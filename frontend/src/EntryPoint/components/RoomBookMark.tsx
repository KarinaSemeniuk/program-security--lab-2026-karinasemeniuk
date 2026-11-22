import { type ReactElement } from "react";

/**
 * Identifies RoomBook with a small geometric floor-plan mark.
 * @returns Decorative brand mark followed by readable brand text.
 */
export function RoomBookMark(): ReactElement {
  return <span className="brand">
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="10" fill="currentColor" />
      <path d="M10 26V10h9a6 6 0 0 1 0 12h-3v4M16 16h3" fill="none"
        stroke="#f3f4e9" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
    </svg>
    <span>RoomBook<span className="brand__dot">.</span></span>
  </span>;
}
