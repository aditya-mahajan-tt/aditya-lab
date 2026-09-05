import type { SVGProps } from "react";

/** DESIGN_SYSTEM.md §9 — inline SVG, 1.5px stroke, 24px grid, currentColor. No icon library. */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function WorkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x={3} y={7.5} width={18} height={12} rx={1.5} />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 13h18" />
    </svg>
  );
}

function EducationIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 2 8.5 12 13l10-4.5Z" />
      <path d="M6 10.8v4.7c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.7" />
      <path d="M21 8.5v6" />
    </svg>
  );
}

export const timelineIcons = { WORK: WorkIcon, EDUCATION: EducationIcon } as const;
