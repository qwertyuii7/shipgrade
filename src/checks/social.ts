import { Check, Context } from "../types.js";

export const socialChecks: Check[] = [
  {
    id: "social.og.title",
    category: "social",
    title: "Open Graph title",
    weight: 3,
    effort: "low",
    why: "Open Graph titles dictate what your link looks like when shared on social platforms like iMessage, Slack, Facebook, and LinkedIn.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const ogTitle = ctx.$('meta[property="og:title"]').attr("content");
      if (!ogTitle) {
        return { status: "fail", message: "Missing og:title", fix: 'Add <meta property="og:title" content="...">.' };
      }
      return { status: "pass", message: "og:title is present", evidence: ogTitle };
    }
  },
  {
    id: "social.og.image",
    category: "social",
    title: "Open Graph image is present",
    weight: 4,
    effort: "low",
    why: "Without a valid, absolute Open Graph image URL, your shared links will just be plain text instead of a rich, clickable preview card.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const ogImage = ctx.$('meta[property="og:image"]').attr("content");
      if (!ogImage) {
        return { status: "fail", message: "Missing og:image", fix: "Add an og:image for rich social sharing." };
      }
      if (!/^https?:\/\//i.test(ogImage)) {
        return { status: "warn", message: "og:image should be an absolute URL", evidence: ogImage, fix: "Use a full absolute URL for og:image." };
      }
      return { status: "pass", message: "og:image is present", evidence: ogImage };
    }
  },
  {
    id: "social.twitter",
    category: "social",
    title: "Twitter Card metadata",
    weight: 3,
    effort: "low",
    why: "Twitter requires specific metadata tags to generate large preview cards. Without them, your tweets will just look like standard text links.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const twitterCard = ctx.$('meta[name="twitter:card"]').attr("content");
      if (!twitterCard) {
        return { 
          status: "warn", 
          message: "Missing twitter:card", 
          fix: 'Add <meta name="twitter:card" content="summary_large_image"> for rich previews on X/Twitter.' 
        };
      }
      return { status: "pass", message: "Twitter card metadata is present", evidence: twitterCard };
    }
  },
  {
    id: "social.favicon",
    category: "social",
    title: "Favicon is reachable",
    weight: 2,
    effort: "low",
    why: "Favicons establish your brand identity in browser tabs and bookmarks. A missing favicon makes your site look unfinished and generic.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      // Find favicon href in html
      let faviconUrl = ctx.$('link[rel~="icon"]').attr("href");
      if (!faviconUrl) {
        // Fallback to default /favicon.ico
        faviconUrl = new URL("/favicon.ico", ctx.finalUrl).href;
      } else if (!faviconUrl.startsWith("http")) {
        // Resolve relative URL
        faviconUrl = new URL(faviconUrl, ctx.finalUrl).href;
      }

      try {
        const res = await fetch(faviconUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          return { status: "pass", message: "Favicon is reachable" };
        }
        return { status: "warn", message: "Favicon is missing or unreachable", fix: "Ensure you have a favicon.ico at the root or a valid <link rel=\"icon\">." };
      } catch (e) {
        return { status: "warn", message: "Failed to fetch favicon", fix: "Ensure your favicon is accessible." };
      }
    }
  },
  {
    id: "social.ogreach",
    category: "social",
    title: "Open Graph image is reachable",
    weight: 4,
    effort: "low",
    why: "If your Open Graph image returns a 404, social platforms will fail to scrape it, resulting in a broken, empty preview card when your link is shared.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const ogImage = ctx.$('meta[property="og:image"]').attr("content");
      if (!ogImage || !/^https?:\/\//i.test(ogImage)) {
        return { status: "info", message: "Skipped (No valid absolute og:image found)" };
      }

      try {
        const res = await fetch(ogImage, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          return { status: "pass", message: "og:image is reachable" };
        }
        return { status: "fail", message: `og:image returned status ${res.status}`, evidence: ogImage, fix: "Ensure your og:image URL is correct and the image is publicly accessible." };
      } catch (e) {
        return { status: "fail", message: "Failed to fetch og:image", evidence: ogImage, fix: "Ensure your og:image URL is correct and reachable." };
      }
    }
  }
];
