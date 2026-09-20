import { Check, Context } from "../types.js";
import tls from "tls";

export const securityChecks: Check[] = [
  {
    id: "sec.https",
    category: "security",
    title: "HTTPS is active",
    weight: 5,
    effort: "low",
    why: "HTTP traffic is unencrypted, exposing your users to man-in-the-middle attacks and causing browsers to mark your site as 'Not Secure'.",
    async run(ctx: Context) {
      if (ctx.finalUrl.startsWith("https://")) {
        return { status: "pass", message: "Site uses HTTPS" };
      }
      return { status: "fail", message: "Site does not use HTTPS", fix: "Enable HTTPS and redirect HTTP to HTTPS." };
    }
  },
  {
    id: "sec.hsts",
    category: "security",
    title: "Strict-Transport-Security header",
    weight: 3,
    effort: "low",
    why: "HSTS forces browsers to always use HTTPS for your domain, protecting against downgrade attacks and cookie hijacking.",
    async run(ctx: Context) {
      const hsts = ctx.headers.get("strict-transport-security");
      if (hsts) {
        return { status: "pass", message: "HSTS header is present", evidence: hsts };
      }
      return { status: "warn", message: "Missing HSTS header", fix: "Add Strict-Transport-Security to headers." };
    }
  },
  {
    id: "sec.xcto",
    category: "security",
    title: "X-Content-Type-Options: nosniff",
    weight: 2,
    effort: "low",
    why: "Without nosniff, browsers might try to execute non-executable files (like images) as code, opening the door to cross-site scripting (XSS) attacks.",
    async run(ctx: Context) {
      const xcto = ctx.headers.get("x-content-type-options");
      if (xcto && xcto.toLowerCase() === "nosniff") {
        return { status: "pass", message: "X-Content-Type-Options is nosniff" };
      }
      return { status: "warn", message: "Missing X-Content-Type-Options header", fix: "Add X-Content-Type-Options: nosniff" };
    }
  },
  {
    id: "sec.csp",
    category: "security",
    title: "Content-Security-Policy header",
    weight: 3,
    effort: "high",
    why: "A Content Security Policy is your strongest defense against XSS and data injection attacks by restricting where scripts and assets can load from.",
    async run(ctx: Context) {
      const csp = ctx.headers.get("content-security-policy");
      if (csp) {
        return { status: "pass", message: "CSP header is present" };
      }
      return { status: "warn", message: "Missing Content-Security-Policy header", fix: "Implement CSP to protect against XSS attacks." };
    }
  },
  {
    id: "sec.frame",
    category: "security",
    title: "X-Frame-Options header",
    weight: 2,
    effort: "low",
    why: "Without frame protection, malicious sites can embed your site in an invisible iframe to trick users into clicking buttons they didn't intend to (Clickjacking).",
    async run(ctx: Context) {
      const frame = ctx.headers.get("x-frame-options");
      const csp = ctx.headers.get("content-security-policy");
      if (frame || (csp && csp.includes("frame-ancestors"))) {
        return { status: "pass", message: "Clickjacking protection is active" };
      }
      return { status: "warn", message: "Missing X-Frame-Options", fix: "Add X-Frame-Options: DENY or SAMEORIGIN (or use CSP frame-ancestors)." };
    }
  },
  {
    id: "sec.referrer",
    category: "security",
    title: "Referrer-Policy header",
    weight: 1,
    effort: "low",
    why: "A loose Referrer-Policy can leak sensitive URLs and user data to third-party domains when users click external links.",
    async run(ctx: Context) {
      const policy = ctx.headers.get("referrer-policy");
      if (policy) {
        return { status: "pass", message: "Referrer-Policy is present" };
      }
      return { status: "warn", message: "Missing Referrer-Policy", fix: "Add Referrer-Policy: strict-origin-when-cross-origin." };
    }
  },
  {
    id: "sec.leak",
    category: "security",
    title: "X-Powered-By is hidden",
    weight: 2,
    effort: "low",
    why: "Exposing exactly what server, language, or framework you use makes it significantly easier for automated scanners to target known vulnerabilities in your stack.",
    async run(ctx: Context) {
      const powered = ctx.headers.get("x-powered-by");
      const server = ctx.headers.get("server");
      let leaks = [];
      if (powered) leaks.push(`X-Powered-By: ${powered}`);
      // Only warn if server header is overly specific (e.g. Apache/2.4.41 (Ubuntu))
      if (server && server.includes("/")) leaks.push(`Server: ${server}`);
      
      if (leaks.length === 0) {
        return { status: "pass", message: "No obvious tech stack leaks in headers" };
      }
      return { status: "warn", message: "Headers leak tech stack details", evidence: leaks.join(", "), fix: "Remove X-Powered-By and obfuscate Server headers to obscure your stack from automated scanners." };
    }
  },
  {
    id: "sec.mixed",
    category: "security",
    title: "Mixed Content (HTTP on HTTPS)",
    weight: 4,
    effort: "medium",
    why: "Loading insecure HTTP assets (like images or scripts) on a secure HTTPS page breaks the security guarantee, and modern browsers will block the active content entirely.",
    async run(ctx: Context & { $: cheerio.CheerioAPI }) {
      if (!ctx.finalUrl.startsWith("https://")) return { status: "info", message: "Skipped (Site not using HTTPS)" };
      
      let mixed: string[] = [];
      ctx.$('img[src], script[src], link[href]').each((_, el) => {
        const src = ctx.$(el).attr("src") || ctx.$(el).attr("href");
        if (src && src.startsWith("http://")) mixed.push(src);
      });

      if (mixed.length > 0) {
        return { status: "fail", message: `Found ${mixed.length} mixed content links`, evidence: mixed[0], fix: "Ensure all scripts, stylesheets, and images use https:// URLs." };
      }
      return { status: "pass", message: "No mixed content detected" };
    }
  },
  {
    id: "sec.cert",
    category: "security",
    title: "TLS Certificate is valid",
    weight: 5,
    effort: "low",
    why: "An expired or invalid SSL certificate will cause browsers to completely block users from visiting your site with a massive, terrifying security warning.",
    async run(ctx: Context) {
      if (!ctx.finalUrl.startsWith("https://")) return { status: "info", message: "Skipped (Site not using HTTPS)" };
      
      const { hostname } = new URL(ctx.finalUrl);
      return new Promise((resolve) => {
        let isResolved = false;
        const socket = tls.connect(443, hostname, { servername: hostname }, () => {
          if (isResolved) return;
          isResolved = true;
          const cert = socket.getPeerCertificate();
          if (socket.authorized) {
            const validTo = new Date(cert.valid_to);
            const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            socket.destroy();
            
            if (daysRemaining < 0) {
              resolve({ status: "fail", message: "TLS Certificate has expired", fix: "Renew your SSL/TLS certificate immediately." });
            } else if (daysRemaining < 14) {
              resolve({ status: "warn", message: `TLS Certificate expires in ${daysRemaining} days`, fix: "Renew your SSL/TLS certificate soon." });
            } else {
              resolve({ status: "pass", message: `TLS Certificate is valid (${daysRemaining} days remaining)` });
            }
          } else {
            socket.destroy();
            resolve({ status: "fail", message: `TLS Certificate is unauthorized: ${socket.authorizationError}`, fix: "Fix your SSL/TLS certificate configuration." });
          }
        });
        
        socket.on("error", (err) => {
          if (isResolved) return;
          isResolved = true;
          resolve({ status: "fail", message: `Failed to verify TLS certificate: ${err.message}`, fix: "Ensure your server is properly configured for HTTPS." });
        });
        
        socket.setTimeout(3000, () => {
          if (isResolved) return;
          isResolved = true;
          socket.destroy();
          resolve({ status: "warn", message: "TLS verification timed out", fix: "Server may be responding slowly to TLS handshakes." });
        });
      });
    }
  }
];
