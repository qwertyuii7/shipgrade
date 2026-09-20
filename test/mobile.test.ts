import { describe, it, expect } from "vitest";
import { mobileChecks } from "../src/checks/mobile.js";
import { createTestContext } from "./helpers.js";

describe("Mobile Checks", () => {
  it("should pass on good HTML", async () => {
    const ctx = createTestContext("good.html");
    const results = await Promise.all(mobileChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail" || r.status === "warn");
    expect(fails).toHaveLength(0);
  });

  it("should fail on bad HTML", async () => {
    const ctx = createTestContext("bad.html");
    const results = await Promise.all(mobileChecks.map(check => check.run(ctx)));
    
    const fails = results.filter(r => r.status === "fail");
    // Missing viewport in bad.html
    expect(fails.length).toBeGreaterThan(0);
  });
});
