import { Check, Context, CheckResult } from "../types.js";

export const seoChecks: Check[] = [
  {
    id: "seo.noindex",
    title: "Page is indexable",
    category: "seo",
    weight: 5,
    effort: "low",
    why: "If your page has a noindex tag or header, search engines will completely ignore it, ensuring it never appears in search results.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const robotsMeta = ctx.$('meta[name="robots"]').attr("content") || "";
      const xRobotsTag = ctx.headers.get("x-robots-tag") || "";
      
      if (robotsMeta.toLowerCase().includes("noindex") || xRobotsTag.toLowerCase().includes("noindex")) {
        return {
          status: "fail",
          message: "Page is blocked from indexing (noindex)",
          fix: "Remove the 'noindex' directive from your meta tags or HTTP headers to allow search engines to index this page."
        };
      }
      return { status: "pass", message: "Page is indexable" };
    },
  },
  {
    id: "seo.status",
    title: "Page returns 200 (OK)",
    category: "seo",
    weight: 5,
    effort: "low",
    why: "If your main page doesn't return a 200 OK status, search engines will assume the page is broken and refuse to index it.",
    run: async (ctx: Context): Promise<CheckResult> => {
      if (ctx.status === 200) {
        return { status: "pass", message: "Status 200 OK" };
      }
      return {
        status: "fail",
        message: `Status code is ${ctx.status}`,
        fix: "Ensure your server returns a 200 OK status code for the main document. Check redirects or error pages.",
      };
    },
  },
  {
    id: "seo.title",
    title: "<title> tag is present and has good length",
    category: "seo",
    weight: 4,
    effort: "low",
    why: "The title tag is the most critical on-page SEO factor. It's the large blue link in search results and directly impacts click-through rates.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const title = ctx.$("title").text().trim();
      if (!title) {
        return {
          status: "fail",
          message: "Missing title tag",
          fix: "Add a <title> tag inside the <head> of your document.",
        };
      }
      if (title.length < 30 || title.length > 60) {
        return {
          status: "warn",
          message: `Title length is ${title.length} characters (ideal: 30-60)`,
          fix: "Adjust title length for optimal display in search results.",
        };
      }
      return { status: "pass", message: "Title tag is optimal" };
    },
  },
  {
    id: "seo.description",
    title: "Meta description is present",
    category: "seo",
    weight: 4,
    effort: "low",
    why: "The meta description acts as your organic ad copy in search results. A missing or poorly-sized description means search engines will auto-generate one, hurting your click-through rate.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const desc = ctx.$('meta[name="description"]').attr("content");
      if (!desc) {
        return {
          status: "fail",
          message: "Missing meta description",
          fix: 'Add <meta name="description" content="..."> to your <head>.',
        };
      }
      if (desc.length < 50 || desc.length > 160) {
        return {
          status: "warn",
          message: `Description length is ${desc.length} chars (ideal: 50-160)`,
          fix: "Rewrite your meta description to be between 50 and 160 characters.",
        };
      }
      return { status: "pass", message: "Meta description is optimal" };
    },
  },
  {
    id: "seo.h1",
    title: "Exactly one <h1> tag exists",
    category: "seo",
    weight: 3,
    effort: "low",
    why: "Search engines use the H1 tag to understand the primary topic of the page. Multiple H1s or a missing H1 dilutes that signal.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const h1Count = ctx.$("h1").length;
      if (h1Count === 0) {
        return {
          status: "fail",
          message: "Missing H1 tag",
          fix: "Add exactly one <h1> tag to your page to signal the main topic.",
        };
      }
      if (h1Count > 1) {
        return {
          status: "warn",
          message: `Found ${h1Count} H1 tags`,
          fix: "While HTML5 allows multiple H1s, best practice for SEO is a single clear H1 per page.",
        };
      }
      return { status: "pass", message: "Exactly one H1 tag found" };
    },
  },
  {
    id: "seo.canonical",
    title: "Canonical Tag is present",
    category: "seo",
    weight: 4,
    effort: "low",
    why: "Canonical tags tell search engines which version of a URL is the 'master' copy, preventing duplicate content penalties if your site is accessible via multiple parameters.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const canonical = ctx.$('link[rel="canonical"]').attr("href");
      if (!canonical) {
        return {
          status: "fail",
          message: "Missing canonical tag",
          fix: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.',
        };
      }
      return { status: "pass", message: "Canonical tag present" };
    },
  },
  {
    id: "seo.lang",
    title: "HTML Lang attribute is set",
    category: "seo",
    weight: 2,
    effort: "low",
    why: "Without a lang attribute, screen readers cannot properly pronounce the text, and search engines struggle to geographically target your content.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const lang = ctx.$("html").attr("lang");
      if (!lang) {
        return {
          status: "fail",
          message: "Missing html lang attribute",
          fix: 'Add a lang attribute to your HTML tag, e.g., <html lang="en">.',
        };
      }
      return { status: "pass", message: `HTML lang is "${lang}"` };
    },
  },
  {
    id: "seo.alt",
    title: "All images have alt tags",
    category: "seo",
    weight: 4,
    effort: "medium",
    why: "Alt text is essential for visually impaired users relying on screen readers, and it helps search engines understand the context of your images for Image Search.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const images = ctx.$("img");
      let missing = 0;
      images.each((_, img) => {
        if (ctx.$(img).attr("alt") === undefined) missing++;
      });
      if (missing > 0) {
        return {
          status: "fail",
          message: `${missing} image(s) missing alt attribute`,
          fix: "Ensure all <img> tags have a descriptive alt attribute for accessibility and SEO.",
        };
      }
      return { status: "pass", message: "All images have alt tags (or no images found)" };
    },
  },
  {
    id: "seo.jsonld",
    title: "JSON-LD structured data is present",
    category: "seo",
    weight: 2,
    effort: "medium",
    why: "Structured data (JSON-LD) allows search engines to display rich snippets (like star ratings, recipes, or product prices) directly in the search results.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const ld = ctx.$('script[type="application/ld+json"]');
      if (ld.length === 0) {
        return {
          status: "warn",
          message: "No JSON-LD structured data found",
          fix: "Consider adding JSON-LD structured data to help search engines understand your content.",
        };
      }
      return { status: "pass", message: "JSON-LD structured data found" };
    },
  },
  {
    id: "seo.robotstxt",
    title: "robots.txt is available",
    category: "seo",
    weight: 3,
    effort: "low",
    why: "A robots.txt file provides explicit crawling rules for search engine bots, ensuring they don't waste crawl budget on admin pages or private routes.",
    run: async (ctx: Context): Promise<CheckResult> => {
      try {
        const url = new URL("/robots.txt", ctx.finalUrl).href;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const text = await res.text();
          // Extremely basic check for blanket disallow
          if (text.includes("Disallow: /") && !text.includes("Allow: /")) {
            return { status: "fail", message: "robots.txt blocks all crawling (Disallow: /)", fix: "Update your robots.txt to allow search engines to crawl your site." };
          }
          return { status: "pass", message: "robots.txt is present and doesn't block all crawling" };
        }
        return { status: "warn", message: "robots.txt is missing", fix: "Add a robots.txt file to the root of your domain to guide crawlers." };
      } catch (e) {
        return { status: "warn", message: "Failed to fetch robots.txt", fix: "Ensure your robots.txt is accessible and not blocking requests." };
      }
    }
  },
  {
    id: "seo.sitemap",
    title: "sitemap.xml is available",
    category: "seo",
    weight: 3,
    effort: "low",
    why: "An XML sitemap acts as a roadmap for search engines, helping them discover and index all your important pages quickly.",
    run: async (ctx: Context): Promise<CheckResult> => {
      try {
        const url = new URL("/sitemap.xml", ctx.finalUrl).href;
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          return { status: "pass", message: "sitemap.xml is present" };
        }
        return { status: "warn", message: "sitemap.xml is missing", fix: "Add a sitemap.xml file and submit it to Google Search Console." };
      } catch (e) {
        return { status: "warn", message: "Failed to fetch sitemap.xml", fix: "Ensure your sitemap is accessible." };
      }
    }
  },
  {
    id: "seo.404",
    title: "Proper 404 status for missing pages",
    category: "seo",
    weight: 4,
    effort: "medium",
    why: "Soft 404s (returning a 200 OK for a page that doesn't exist) confuse search engines, wasting your crawl budget and getting garbage URLs indexed.",
    run: async (ctx: Context): Promise<CheckResult> => {
      try {
        const randomPath = `/does-not-exist-${Math.random().toString(36).substring(7)}`;
        const url = new URL(randomPath, ctx.finalUrl).href;
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (res.status === 404) {
          return { status: "pass", message: "Missing pages return 404" };
        }
        return { status: "warn", message: `Missing pages return ${res.status} (Soft 404)`, fix: "Ensure your server returns a true 404 Not Found status for unknown URLs to prevent SEO issues." };
      } catch (e) {
        return { status: "warn", message: "Failed to verify 404 behavior", fix: "Ensure your server handles unknown paths gracefully." };
      }
    }
  },
  {
    id: "seo.links",
    title: "No broken links (Sample of 10)",
    category: "seo",
    weight: 4,
    effort: "low",
    why: "Broken outbound or internal links create dead ends for users and search engine crawlers, severely damaging your SEO rankings and user experience.",
    run: async (ctx: Context & { $: cheerio.CheerioAPI }): Promise<CheckResult> => {
      const internalLinks = new Set<string>();
      const externalLinks = new Set<string>();
      
      ctx.$('a[href]').each((_, el) => {
        let href = ctx.$(el).attr("href");
        if (href) {
          if (href.startsWith("http")) {
            if (href.includes(new URL(ctx.finalUrl).hostname)) {
              internalLinks.add(href);
            } else {
              externalLinks.add(href);
            }
          } else if (href.startsWith("/") || (!href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:"))) {
            try {
              const absUrl = new URL(href, ctx.finalUrl).href;
              internalLinks.add(absUrl);
            } catch (e) {}
          }
        }
      });
      
      let sample = Array.from(internalLinks);
      if (sample.length < 10) {
        sample = sample.concat(Array.from(externalLinks)).slice(0, 10);
      } else {
        sample = sample.slice(0, 10);
      }

      if (sample.length === 0) return { status: "info", message: "Skipped (No links found to test)" };

      let broken = 0;
      await Promise.all(sample.map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
          // Ignore 403 (Forbidden), 429 (Rate Limit), 999 (LinkedIn bot protection) as false positives
          if (res.status === 404 || res.status >= 500) broken++;
        } catch (e) {
          broken++;
        }
      }));

      if (broken > 0) {
        return { status: "warn", message: `${broken} of ${sample.length} sampled links are broken`, fix: "Ensure all external and absolute links on your page are valid and reachable." };
      }
      return { status: "pass", message: `All ${sample.length} sampled links are reachable` };
    }
  }
];
