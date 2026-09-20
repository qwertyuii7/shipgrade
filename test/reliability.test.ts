import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reliabilityChecks } from "../src/checks/reliability.js";
import { createTestContext } from "./helpers.js";

describe("Reliability Checks", () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = url.toString();
      if (href.includes("bad-redirect")) {
        return new Response("", { status: 301, headers: { location: "http://somewhere-else.com" } });
      } else if (href.includes("no-redirect")) {
        return new Response("", { status: 200 });
      }
      return new Response("", { status: 301, headers: { location: "https://example.com" } });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass when opposite hostname redirects properly", async () => {
    const ctx = createTestContext("good.html");
    ctx.finalUrl = "https://example.com";
    const results = await Promise.all(reliabilityChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    expect(fails).toHaveLength(0);
  });

  it("should fail/warn on bad redirects", async () => {
    const ctx = createTestContext("bad.html");
    ctx.finalUrl = "https://bad-redirect.com";
    
    const results = await Promise.all(reliabilityChecks.map(check => check.run(ctx)));
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    expect(fails.length).toBeGreaterThan(0);
  });
});
