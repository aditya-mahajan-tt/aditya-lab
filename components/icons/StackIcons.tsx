import type { SVGProps } from "react";

/**
 * DESIGN_SYSTEM.md §9 — inline SVG, 1.5px stroke, 24px grid, currentColor.
 * No icon library. One icon per data/build.ts stack category.
 */
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

function FrontendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x={3} y={4.5} width={18} height={15} rx={1.5} />
      <path d="M3 8.5h18" />
      <path d="M6.5 6.5h.01M9.5 6.5h.01" />
    </svg>
  );
}

function MotionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 15c2.5 0 2.5-6 5-6s2.5 9 5 9 2.5-9 5-9 2.5 6 5 6" />
    </svg>
  );
}

function ThreeDIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8Z" />
      <path d="M12 3.5 20 8l-8 4.5L4 8Z" />
      <path d="M12 12.5V20.5" />
    </svg>
  );
}

function DataIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx={12} cy={5.5} rx={7.5} ry={2.5} />
      <path d="M4.5 5.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6" />
      <path d="M4.5 11.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6" />
    </svg>
  );
}

function IntelligenceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function DeployIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15.5V4M12 4 7.5 8.5M12 4l4.5 4.5" />
      <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export const stackIcons = {
  FRONTEND: FrontendIcon,
  MOTION: MotionIcon,
  "3D": ThreeDIcon,
  DATA: DataIcon,
  INTELLIGENCE: IntelligenceIcon,
  DEPLOY: DeployIcon,
} as const;
