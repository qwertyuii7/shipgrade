import { Check, Context } from "../types.js";

export const reliabilityChecks: Check[] = [
  {
    id: "rel.www",
    category: "reliability",
    title: "www / non-www consistency",
    weight: 2,
    effort: "low",
    async run(ctx: Context) {
      try {
        const urlObj = new URL(ctx.finalUrl);
        const hasWww = urlObj.hostname.startsWith("www.");
        
        // Construct the opposite URL
        const oppositeHostname = hasWww 
          ? urlObj.hostname.replace("www.", "") 
          : `www.${urlObj.hostname}`;
          
        urlObj.hostname = oppositeHostname;
        const oppositeUrl = urlObj.href;

        const res = await fetch(oppositeUrl, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(3000) });
        
        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (location && (location === ctx.finalUrl || location === ctx.finalUrl + "/")) {
            return { status: "pass", message: `${oppositeHostname} correctly redirects to your primary domain` };
          }
          return { status: "warn", message: `${oppositeHostname} redirects, but not to your primary domain`, evidence: `Redirects to ${location}` };
        } else if (res.ok) {
          return { status: "fail", message: `${oppositeHostname} does not redirect`, fix: `Configure your DNS and server to redirect ${oppositeHostname} to your primary domain to prevent duplicate content.` };
        }
        return { status: "warn", message: `Failed to resolve ${oppositeHostname}` };
      } catch (e) {
        return { status: "warn", message: "Failed to check www / non-www consistency", fix: "Ensure both www and non-www versions are configured in DNS." };
      }
    }
  }
];
