import { Check, Context } from "../types.js";

export const mobileChecks: Check[] = [
  {
    id: "mobile.viewport",
    category: "mobile",
    title: "Viewport meta tag",
    weight: 5,
    effort: "low",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      const viewport = ctx.$('meta[name="viewport"]').attr("content");
      if (!viewport) {
        return { status: "fail", message: "Missing viewport meta tag", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' };
      }
      if (!viewport.includes("width=device-width")) {
        return { status: "warn", message: "Viewport missing width=device-width", evidence: viewport, fix: "Ensure viewport has width=device-width for mobile scaling." };
      }
      return { status: "pass", message: "Viewport tag looks good", evidence: viewport };
    }
  }
];
