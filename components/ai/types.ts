export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  link?: { label: string; href: string };
};
