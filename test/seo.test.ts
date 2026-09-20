import * as cheerio from "cheerio";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { seoChecks } from "../src/checks/seo.js";
import { createTestContext } from "./helpers.js";

describe("SEO Checks", () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = url.toString();
      if (href.includes("robots.txt") || href.includes("sitemap.xml")) {
        return new Response("ok", { status: 200 });
      }
      if (href.includes("does-not-exist") || href.includes("broken")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response("", { status: 200 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass on good HTML", async () => {
    const ctx = createTestContext("good.html");
    const results = await Promise.all(seoChecks.map(check => check.run(ctx)));
    
    // Everything should pass or warn (jsonld missing in good.html is a warn, but let's check it)
    const fails = results.filter(r => r.status === "fail");
    expect(fails).toHaveLength(0);
  });

  it("should fail on bad HTML", async () => {
    const ctx = createTestContext("bad.html");
    // Inject a broken link for the sampler check
    ctx.html += '<a href="http://example.com/broken">Broken</a>';
    ctx.$ = cheerio.load(ctx.html);
    
    const results = await Promise.all(seoChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    // status 200 passes, but others (title, desc, h1, canonical, lang, robots, sitemap, 404, links) fail or warn
    expect(fails.length).toBeGreaterThan(0);
  });
});
