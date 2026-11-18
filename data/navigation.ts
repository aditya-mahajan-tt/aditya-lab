export type NavItem = {
  label: string;
  href: string;
  description: string;
};

/** Single source for the header, mobile menu, command palette and sitemap. */
export const navigation: NavItem[] = [
  { label: "WORK", href: "/work", description: "Where I have worked and what I owned there" },
  { label: "PROJECTS", href: "/projects", description: "Things I built and shipped, and case studies" },
  { label: "ABOUT", href: "/about", description: "Background and capabilities" },
  { label: "THINKING", href: "/thinking", description: "How I approach problems" },
  { label: "CONTACT", href: "/contact", description: "Start a conversation" },
  { label: "RESUME", href: "/resume", description: "Download the resume" },
  { label: "LAB", href: "/", description: "The homepage experience" },
  { label: "SYSTEMS", href: "/systems", description: "Interactive diagrams of how the work actually runs" },
  { label: "EXPERIMENTS", href: "/experiments", description: "Things being built and broken" },
  { label: "LAB LOG", href: "/log", description: "A running record of builds, experiments and learning" },
  { label: "BUILD MODE", href: "/build", description: "The stack, architecture and decisions behind this site" },
];
