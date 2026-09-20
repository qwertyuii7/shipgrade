import { Check, Context } from "../types.js";

export const perfChecks: Check[] = [
  {
    id: "perf.compress",
    category: "perf",
    title: "Response compressed (br / gzip)",
    weight: 4,
    effort: "low",
    why: "Compression drastically reduces the file size of your HTML, CSS, and JS, meaning your site loads significantly faster for users on slow networks.",
    async run(ctx: Context) {
      const encoding = ctx.headers.get("content-encoding");
      if (encoding && (encoding.includes("br") || encoding.includes("gzip"))) {
        return { status: "pass", message: "Response is compressed", evidence: encoding };
      }
      return { status: "warn", message: "Response does not seem compressed", fix: "Enable gzip or brotli compression on your server/CDN." };
    }
  },
  {
    id: "perf.ttfb",
    category: "perf",
    title: "Server response time (TTFB)",
    weight: 3,
    effort: "medium",
    why: "Time to First Byte measures your server's responsiveness. High TTFB means users stare at a blank screen longer before the page even begins to load.",
    async run(ctx: Context) {
      const { ttfb } = ctx.timing;
      if (ttfb < 300) {
        return { status: "pass", message: `Fast TTFB (${ttfb}ms)`, evidence: `${ttfb}ms` };
      } else if (ttfb < 800) {
        return { status: "warn", message: `Moderate TTFB (${ttfb}ms)`, evidence: `${ttfb}ms`, fix: "Consider caching or CDN to improve server response time." };
      }
      return { status: "fail", message: `Slow TTFB (${ttfb}ms)`, evidence: `${ttfb}ms`, fix: "TTFB is very high. Check server performance or add a CDN." };
    }
  },
  {
    id: "perf.cache",
    category: "perf",
    title: "Cache-Control header",
    weight: 2,
    effort: "low",
    why: "Static assets without Cache-Control headers force repeat visitors to re-download unchanged files, wasting bandwidth and slowing down navigation.",
    async run(ctx: Context) {
      const cache = ctx.headers.get("cache-control");
      if (cache && !cache.includes("no-cache")) {
        return { status: "pass", message: "Cache-Control is present", evidence: cache };
      }
      return { status: "warn", message: "Missing or overly restrictive Cache-Control", fix: "Add a Cache-Control header to allow browser caching of static assets." };
    }
  },
  {
    id: "perf.html",
    category: "perf",
    title: "HTML Document Size",
    weight: 3,
    effort: "low",
    why: "A massive HTML document is slow to download and expensive for browsers to parse, often indicating bloated server-side rendering or excessive inline CSS/JS.",
    async run(ctx: Context) {
      const sizeBytes = Buffer.byteLength(ctx.html, "utf8");
      const sizeKb = Math.round(sizeBytes / 1024);
      if (sizeKb < 100) {
        return { status: "pass", message: `Small HTML document (${sizeKb}KB)`, evidence: `${sizeKb}KB` };
      } else if (sizeKb < 300) {
        return { status: "warn", message: `Large HTML document (${sizeKb}KB)`, evidence: `${sizeKb}KB`, fix: "Consider reducing inline CSS/JS or simplifying DOM to speed up parsing." };
      }
      return { status: "fail", message: `Massive HTML document (${sizeKb}KB)`, evidence: `${sizeKb}KB`, fix: "Document is >300KB. Server rendering might be bloated. Reduce DOM size." };
    }
  },
  {
    id: "perf.lazy",
    category: "perf",
    title: "Lazy-loaded images",
    weight: 2,
    effort: "low",
    why: "Images below the fold without loading=\"lazy\" are downloaded immediately, stealing bandwidth from critical assets that the user actually sees right now.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const images = ctx.$("img");
      let missing = 0;
      images.each((_, img) => {
        if (ctx.$(img).attr("loading") !== "lazy") missing++;
      });
      // We don't fail because above-the-fold images SHOULD NOT be lazy loaded.
      // But if there are dozens of images without lazy loading, it's a warning.
      if (missing > 5) {
        return { status: "warn", message: `${missing} images missing loading="lazy"`, fix: "Add loading=\"lazy\" to images below the fold to save bandwidth." };
      }
      return { status: "pass", message: "Images appear efficiently loaded" };
    }
  },
  {
    id: "perf.blocking",
    category: "perf",
    title: "Render-blocking scripts",
    weight: 4,
    effort: "medium",
    why: "Synchronous scripts in the <head> block the browser from rendering the page until they finish downloading and executing, causing a white-screen delay.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const scripts = ctx.$("head script[src]");
      let blocking = 0;
      scripts.each((_, script) => {
        const el = ctx.$(script);
        if (el.attr("defer") === undefined && el.attr("async") === undefined) {
          blocking++;
        }
      });
      if (blocking > 0) {
        return { status: "fail", message: `${blocking} render-blocking script(s) in <head>`, fix: "Add 'defer' or 'async' to <script> tags in the head to avoid blocking page render." };
      }
      return { status: "pass", message: "No render-blocking scripts found in <head>" };
    }
  },
  {
    id: "perf.images",
    category: "perf",
    title: "No broken images (Sample of 10)",
    weight: 3,
    effort: "low",
    why: "Broken images result in ugly missing-image icons, immediately breaking trust and making your site look unmaintained or broken.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const images = new Set<string>();
      ctx.$('img[src]').each((_, el) => {
        let src = ctx.$(el).attr("src");
        if (src) {
          if (!src.startsWith("http")) src = new URL(src, ctx.finalUrl).href;
          images.add(src);
        }
      });
      
      const sample = Array.from(images).slice(0, 10);
      if (sample.length === 0) return { status: "info", message: "Skipped (No images found to test)" };

      let broken = 0;
      await Promise.all(sample.map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
          if (res.status === 404 || res.status >= 500) broken++;
        } catch (e) {
          broken++;
        }
      }));

      if (broken > 0) {
        return { status: "fail", message: `${broken} of ${sample.length} sampled images are broken`, fix: "Ensure all image links are valid and return 200 OK." };
      }
      return { status: "pass", message: `All ${sample.length} sampled images are reachable` };
    }
  }
];
