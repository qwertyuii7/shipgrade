import * as cheerio from "cheerio";
import { Context } from "../types.js";
import { META } from "../meta.js";

export async function fetchContext(targetUrl: string): Promise<Context & { $: cheerio.CheerioAPI }> {
  // Add protocol if missing
  let normalizedUrl = targetUrl;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const start = performance.now();
  let ttfb = 0;

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      headers: {
        "User-Agent": META.userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // We rely on native fetch to follow redirects
    });

    // Time to First Byte (approximate, since native fetch doesn't expose it directly, 
    // but when headers arrive, the promise resolves before body is fully read)
    ttfb = performance.now() - start;

    const html = await response.text();
    const totalTime = performance.now() - start;
    
    const $ = cheerio.load(html);
    
    // SPA detection heuristic: clone body, remove scripts/styles, and check remaining text length
    const bodyClone = $("body").clone();
    bodyClone.find("script, style, noscript").remove();
    const textLength = bodyClone.text().trim().length;
    const isSPA = textLength < 50 && $("script").length > 0;

    return {
      url: normalizedUrl,
      finalUrl: response.url,
      status: response.status,
      headers: response.headers,
      html,
      $,
      timing: {
        ttfb: Math.round(ttfb),
        total: Math.round(totalTime),
      },
      isSPA
    };
  } catch (err: any) {
    const fetchErr = new Error(`Failed to fetch ${normalizedUrl}: ${err.message}`);
    fetchErr.cause = err;
    throw fetchErr;
  }
}
