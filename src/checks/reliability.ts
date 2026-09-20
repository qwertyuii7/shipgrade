import { Check, Context } from "../types.js";

export const reliabilityChecks: Check[] = [
  {
    id: "rel.www",
    category: "reliability",
    title: "www / non-www consistency",
    weight: 2,
    effort: "low",
    why: "Serving your site on both www and non-www without a redirect splits your search engine ranking power (SEO equity) and creates duplicate content issues.",
    async run(ctx: Context) {
      try {
        const urlObj = new URL(ctx.finalUrl);
        const parts = urlObj.hostname.split('.');
        
        const isUkCompound = urlObj.hostname.match(/\.(co|org|gov|ac|me|net)\.uk$/i);
        const isComAu = urlObj.hostname.match(/\.com\.au$/i);
        if (parts.length > 2 && !urlObj.hostname.startsWith("www.") && !isUkCompound && !isComAu) {
           return { status: "info", message: "Skipped (subdomain detected)" };
        }
        
        const hasWww = urlObj.hostname.startsWith("www.");
        const oppositeHostname = hasWww ? urlObj.hostname.replace("www.", "") : `www.${urlObj.hostname}`;
          
        urlObj.hostname = oppositeHostname;
        const oppositeUrl = urlObj.href;

        let res;
        try {
          res = await fetch(oppositeUrl, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(3000) });
        } catch (err: any) {
          if (err.cause?.code === 'ENOTFOUND' || err.code === 'ENOTFOUND') {
            return { status: "info", message: `No ${oppositeHostname} DNS record found (which is fine)` };
          }
          return { status: "warn", message: `Failed to connect to ${oppositeHostname} (e.g. timeout or SSL error)` };
        }
        
        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (location) {
             const locUrl = new URL(location, oppositeUrl);
             if (locUrl.hostname === new URL(ctx.finalUrl).hostname) {
               return { status: "pass", message: `${oppositeHostname} correctly redirects to your primary domain` };
             }
             return { status: "warn", message: `${oppositeHostname} redirects, but not to your primary domain`, evidence: `Redirects to ${location}` };
          }
        } else if (res.ok) {
          return { status: "fail", message: `${oppositeHostname} does not redirect`, fix: `Configure your DNS and server to redirect ${oppositeHostname} to your primary domain to prevent duplicate content.` };
        }
        return { status: "warn", message: `Unexpected status ${res.status} from ${oppositeHostname}` };
      } catch (e) {
        return { status: "warn", message: "Failed to check www / non-www consistency", fix: "Ensure both www and non-www versions are configured in DNS." };
      }
    }
  }
];
