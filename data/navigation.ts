export type NavItem = {
  label: string;
  href: string;
  description: string;
};

/** Single source for the header, mobile menu, command palette and sitemap. */
export const navigation: NavItem[] = [
  { label: "LAB", href: "/", description: "The homepage experience" },
  { label: "WORK", href: "/work", description: "Case studies and projects" },
  { label: "SYSTEMS", href: "/systems", description: "Interactive diagrams of how the work actually runs" },
  { label: "EXPERIMENTS", href: "/experiments", description: "Things being built and broken" },
  { label: "THINKING", href: "/thinking", description: "How Aditya approaches problems" },
  { label: "ABOUT", href: "/about", description: "Background and capabilities" },
  { label: "BUILD MODE", href: "/build", description: "The stack, architecture and decisions behind this site" },
  { label: "LAB LOG", href: "/log", description: "A running record of builds, experiments and learning" },
  { label: "CONTACT", href: "/contact", description: "Start a conversation" },
  { label: "RESUME", href: "/resume", description: "Download the resume" },
];
