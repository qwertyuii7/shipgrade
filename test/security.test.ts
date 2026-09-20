import * as cheerio from "cheerio";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import tls from "tls";
import { securityChecks } from "../src/checks/security.js";
import { createTestContext } from "./helpers.js";
import { Socket } from "net";

describe("Security Checks", () => {
  beforeEach(() => {
    vi.spyOn(tls, 'connect').mockImplementation((...args: any[]) => {
      // Find the callback which is the last function arg
      const callback = args.find(a => typeof a === 'function');
      const mockSocket = new Socket();
      mockSocket.authorized = true;
      (mockSocket as any).getPeerCertificate = () => ({
        valid_to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // Valid for 30 days
      });
      // Delay slightly to mimic async
      setTimeout(() => {
        if (callback) callback();
      }, 10);
      return mockSocket as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should pass on good HTML", async () => {
    const ctx = createTestContext("good.html", {
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin"
    });
    const results = await Promise.all(securityChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    expect(fails).toHaveLength(0);
  });

  it("should fail/warn on bad HTML", async () => {
    // Bad HTML with no security headers, and let's add a mixed content link
    const ctx = createTestContext("bad.html", {
      "x-powered-by": "Express", // this will warn
    });
    // Manually inject a mixed content link for the test
    ctx.html += '<img src="http://insecure.com/image.jpg">';
    ctx.$ = cheerio.load(ctx.html);
    
    const results = await Promise.all(securityChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    // Missing HSTS, XCTO, CSP, X-Frame, Referrer, Mixed Content, and Server Leak
    expect(fails.length).toBeGreaterThan(0);
  });
});
