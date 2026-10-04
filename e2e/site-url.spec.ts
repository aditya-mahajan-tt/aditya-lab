import { test, expect } from "@playwright/test";
import { resolveSiteUrl } from "@/data/site";

test.describe("site URL resolution @site-url", () => {
  test("an explicit NEXT_PUBLIC_SITE_URL wins", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://real.example",
        VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
        VERCEL_URL: "deploy-abc.vercel.app",
      }),
    ).toBe("https://real.example");
  });

  test("the production project URL beats the per-deployment URL", () => {
    expect(
      resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app", VERCEL_URL: "deploy-abc.vercel.app" }),
    ).toBe("https://prod.vercel.app");
  });

  test("then the per-deployment URL, then localhost", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "deploy-abc.vercel.app" })).toBe("https://deploy-abc.vercel.app");
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
