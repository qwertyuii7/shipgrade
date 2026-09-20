import * as cheerio from "cheerio";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { perfChecks } from "../src/checks/perf.js";
import { createTestContext } from "./helpers.js";

describe("Performance Checks", () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const href = url.toString();
      if (href.includes("broken")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response("ok", { status: 200 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass on good HTML", async () => {
    const ctx = createTestContext("good.html", {
      "content-encoding": "gzip",
      "cache-control": "public, max-age=31536000",
    });
    // add small timing
    ctx.timing = { ttfb: 150, total: 200 };

    const results = await Promise.all(perfChecks.map(check => check.run(ctx)));
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    expect(fails).toHaveLength(0);
  });

  it("should fail/warn on bad HTML", async () => {
    const ctx = createTestContext("bad.html");
    // No compression, no cache-control
    ctx.timing = { ttfb: 1000, total: 1100 }; // slow ttfb
    
    // add >5 missing lazy load images and a blocking script, and a broken image link
    ctx.html += `
      <img src="1.jpg"><img src="2.jpg"><img src="3.jpg">
      <img src="4.jpg"><img src="5.jpg"><img src="6.jpg">
      <img src="http://example.com/broken.jpg">
    `;
    // add blocking script
    ctx.html = ctx.html.replace("</head>", '<script src="blocking.js"></script></head>');
    
    // make it massive to fail the HTML size check (301KB)
    ctx.html += "a".repeat(301 * 1024);
    
    ctx.$ = cheerio.load(ctx.html);
    
    const results = await Promise.all(perfChecks.map(check => check.run(ctx)));
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    
    // Missing compression, Slow TTFB, Missing Cache-Control, Massive HTML, missing lazy images, blocking script, broken image
    expect(fails.length).toBeGreaterThan(0);
  });
});
