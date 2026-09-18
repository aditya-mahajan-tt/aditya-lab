import { test, expect } from "@playwright/test";

/**
 * Voice input for Ask the Lab (components/ai/useVoiceInput.ts).
 *
 * Deliberately NOT covered: a real recording. Driving getUserMedia through
 * Playwright's fake-media flags would test Chromium's audio stack, then a
 * live Groq transcription — a network call this suite must run without,
 * exactly as the note at the top of ask-the-lab.spec.ts says of /api/ask.
 * What is worth locking down is everything that must hold whether or not a
 * microphone exists: that the control is announced, reachable and honest,
 * that it never steals the Enter key from the question, and that a refused
 * permission degrades to typing rather than to a dead end.
 */

async function openDialog(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Ask the Lab" }).click();
  const dialog = page.locator('dialog[aria-label="Ask the Lab"]');
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the voice control is announced as a toggle and does not submit the form", async ({ page }) => {
  const dialog = await openDialog(page);

  const mic = dialog.getByRole("button", { name: "Ask by voice" });
  await expect(mic).toBeVisible();
  // aria-pressed is what tells a screen reader this is a toggle that is
  // currently off, rather than an action that has already happened.
  await expect(mic).toHaveAttribute("aria-pressed", "false");
  // type="button" inside a <form>: without it, the browser treats it as a
  // submit and the mic would fire the question instead of the microphone.
  await expect(mic).toHaveAttribute("type", "button");
});

test("the voice control is keyboard reachable and never traps focus before the input", async ({
  page,
}) => {
  const dialog = await openDialog(page);
  const input = dialog.getByRole("textbox", { name: "Ask the Lab a question" });
  await expect(input).toBeFocused();

  // The question box must come first in the tab order — someone who wants
  // to type should never pass through the microphone to get there.
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Ask by voice" })).toBeFocused();
});

test("a denied microphone leaves typing working and says so", async ({ page, context }) => {
  // Chromium grants nothing by default in Playwright, so getUserMedia
  // rejects — the same path a visitor takes when they click "Block".
  await context.clearPermissions();
  const dialog = await openDialog(page);

  await dialog.getByRole("button", { name: "Ask by voice" }).click();

  // The failure is explained in the live region, not swallowed.
  await expect(dialog.getByText(/type your question instead/i)).toBeVisible();

  // And the feature it replaced still works.
  const input = dialog.getByRole("textbox", { name: "Ask the Lab a question" });
  await input.fill("What has he built?");
  await expect(input).toHaveValue("What has he built?");
  await expect(dialog.getByRole("button", { name: "Send question" })).toBeEnabled();
});

test("spoken answers stay hidden while the TTS model is not configured", async ({ page }) => {
  // app/api/speak/route.ts reports enabled:false until AI_TTS_MODEL is set
  // (the Groq org admin must accept the model's terms first). A "Listen"
  // button that cannot play anything is worse than no button.
  const probe = await page.request.get("/api/speak");
  const { enabled } = (await probe.json()) as { enabled: boolean };

  const dialog = await openDialog(page);
  await dialog.getByRole("button", { name: "What has he built?" }).click();
  await expect(dialog.getByText(/Lab >/)).toBeVisible();

  const listen = dialog.getByRole("button", { name: "Read this answer aloud" });
  if (enabled) await expect(listen).toBeVisible();
  else await expect(listen).toHaveCount(0);
});
