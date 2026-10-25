import { test, expect } from "@playwright/test";

test.describe("homepage tour", () => {
  test("first visit shows a dismissible prompt once, and the hero button runs the whole tour", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    const prompt = page.getByRole("region", { name: "Site tour" });
    await expect(prompt).toBeVisible();
    await prompt.getByRole("button", { name: "Not now" }).click();
    await expect(prompt).toBeHidden();

    await page.reload();
    await expect(page.getByRole("button", { name: /take a short tour/i })).toBeVisible();
    await expect(prompt).toBeHidden();

    await page.getByRole("button", { name: /take a short tour/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("STEP 1 /");

    const done = dialog.getByRole("button", { name: "Done" });
    while (!(await done.isVisible())) {
      await dialog.getByRole("button", { name: "Next" }).click();
    }
    await done.click();
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("Escape skips the tour", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /take a short tour/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
