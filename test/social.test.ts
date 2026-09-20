import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { socialChecks } from "../src/checks/social.js";
import { createTestContext } from "./helpers.js";

describe("Social Checks", () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      // Mock successful fetch for og:image and favicon
      return new Response("ok", { status: 200 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass on good HTML", async () => {
    const ctx = createTestContext("good.html");
    const results = await Promise.all(socialChecks.map(check => check.run(ctx)));
    
    // In good.html, we don't have twitter:card, so it warns. But og:title and og:image pass.
    const fails = results.filter(r => r.status === "fail");
    expect(fails).toHaveLength(0);
  });

  it("should fail on bad HTML", async () => {
    const ctx = createTestContext("bad.html");
    const results = await Promise.all(socialChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail");
    // missing og:image, missing og:title
    expect(fails.length).toBeGreaterThan(0);
  });
});
