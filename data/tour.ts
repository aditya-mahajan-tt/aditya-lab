/**
 * The homepage tour (components/tour/SiteTour). Copy lives here, not in the
 * component (CLAUDE.md §9). `target` is a `data-tour` attribute value; a step
 * whose target is missing or hidden at start (the ⌘K button below `md`) is
 * dropped for that visitor rather than shown pointing at nothing.
 */
export type TourStep = {
  target: string;
  title: string;
  body: string;
};

export const tourPrompt = {
  chip: "New here? Take a short tour to see what this lab can do.",
  start: "Start tour",
  dismiss: "Not now",
  trigger: "Take a short tour",
};

export const tourSteps: TourStep[] = [
  {
    target: "core",
    title: "The lab at a glance",
    body: "Each bright, ringed node is a real page: a capability, a project or an experiment. Hover for a preview, click to open it.",
  },
  {
    target: "ask",
    title: "Ask the Lab",
    body: "Ask a question about Aditya's work. Answers come from this site's own content.",
  },
  {
    target: "palette",
    title: "Jump anywhere",
    body: "Press ⌘K (Ctrl+K on Windows) to search every page and project.",
  },
  {
    target: "menu",
    title: "Every section",
    body: "Work, projects, systems, experiments, thinking, about, contact and the resume are all in the menu.",
  },
  {
    target: "lab",
    title: "Walk through the lab",
    body: "Six stations, each also its own page. Explore them here or open one directly.",
  },
  {
    target: "work",
    title: "Selected projects",
    body: "Open any project for its full case study.",
  },
  {
    target: "contact",
    title: "Say hello",
    body: "Start a conversation whenever you are ready.",
  },
];
