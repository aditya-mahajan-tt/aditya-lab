export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  link?: { label: string; href: string };
  timestamp: number;
};

/** Lifted to AskTheLab so the header status indicator reflects real state. */
export type AskStatus = "idle" | "pending" | "offline" | "rate_limited";
