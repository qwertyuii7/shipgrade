import { describe, it, expect } from "vitest";
import { generateHtmlString } from "../src/report/html.js";
import { Report } from "../src/types.js";
import { META } from "../src/meta.js";

describe("HTML Security Escaping", () => {
  it("escapes malicious scripts in titles and evidence", () => {
    const maliciousReport: Report = {
      url: "https://example.com",
      finalUrl: "https://example.com",
      scannedAt: "2026-09-20T12:00:00Z",
      tool: { name: META.name, version: META.version, schemaVersion: META.schemaVersion },
      score: 10,
      grade: "F",
      topFixes: [
        {
          id: "sec.xss",
          message: "<script>alert('fix')</script>",
          fix: "<img src=x onerror=alert(1)>",
          impact: 10,
          effort: "high"
        }
      ],
      categories: {
        security: {
          score: 0,
          results: [
            {
              id: "sec.xss",
              status: "fail",
              message: "<script>alert('message')</script>",
              evidence: "<script>alert('evidence')</script>",
              why: "<script>alert('why')</script>",
              effort: "high",
              weight: 5
            }
          ]
        }
      }
    };

    const html = generateHtmlString(maliciousReport);

    // Ensure raw scripts are not present in the HTML output
    expect(html).not.toContain("<script>alert('message')</script>");
    expect(html).not.toContain("<script>alert('evidence')</script>");
    expect(html).not.toContain("<script>alert('why')</script>");
    expect(html).not.toContain("<script>alert('fix')</script>");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");

    // Ensure they are properly escaped
    expect(html).toContain("&lt;script&gt;alert(&#039;message&#039;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    
    // Ensure CSP is present
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("default-src 'none'");
  });
});
