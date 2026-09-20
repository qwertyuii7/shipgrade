import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { Context } from "../src/types.js";

export function createTestContext(fixtureName: "good.html" | "bad.html", customHeaders?: Record<string, string>): Context & { $: cheerio.CheerioAPI } {
  const htmlPath = path.resolve(__dirname, "fixtures", fixtureName);
  const html = fs.readFileSync(htmlPath, "utf-8");

  const headers = new Headers();
  if (customHeaders) {
    for (const [k, v] of Object.entries(customHeaders)) {
      headers.set(k, v);
    }
  } else {
    // Defaults for good context
    if (fixtureName === "good.html") {
      headers.set("strict-transport-security", "max-age=31536000");
      headers.set("x-content-type-options", "nosniff");
      headers.set("content-encoding", "gzip");
    }
  }

  return {
    url: "https://example.com",
    finalUrl: "https://example.com/",
    status: 200,
    headers,
    html,
    $: cheerio.load(html),
    timing: { ttfb: 150, total: 200 },
  };
}
