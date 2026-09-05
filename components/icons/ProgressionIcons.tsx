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

function CuriousIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx={12} cy={12} r={8} />
      <path d="M15 9l-4.5 2.5L8 16l4.5-2.5L15 9Z" />
    </svg>
  );
}

function BuilderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.6l-6.4 6.4a1.5 1.5 0 0 0 2.1 2.1l6.4-6.4a3.5 3.5 0 0 0 4.6-4.6l-2.6 2.6-2-2Z" />
    </svg>
  );
}

function MarketerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 18 10 12l3.5 3.5L21 8" />
      <path d="M15.5 8H21v5.5" />
    </svg>
  );
}

function ProductThinkerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx={12} cy={12} r={8} />
      <circle cx={12} cy={12} r={3} />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    </svg>
  );
}

function AiExplorerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
      <path d="M9 18h6M10 21h4" />
    </svg>
  );
}

function StillExperimentingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 0 1 13.3-6M20 12a8 8 0 0 1-13.3 6" />
      <path d="M17.3 6v-3.2M17.3 6h-3.2M6.7 18v3.2M6.7 18h3.2" />
    </svg>
  );
}

/** Index-ordered to match data/about.ts's `progression` array exactly. */
export const progressionIcons = [
  CuriousIcon,
  BuilderIcon,
  MarketerIcon,
  ProductThinkerIcon,
  AiExplorerIcon,
  StillExperimentingIcon,
] as const;
