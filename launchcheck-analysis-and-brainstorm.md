# Launchcheck: Deep Analysis & Brainstorming Report

## 1. Core Concept Analysis
**The Vision:** `launchcheck` is a zero-configuration, terminal-first CLI tool designed to audit live websites for readiness before a launch. It evaluates SEO, social sharing, security, mobile responsiveness, performance hints, and reliability. 

**The Bet:** While tools like Lighthouse and SEO crawlers exist, they are often heavy, require setup, or produce dry, unshareable reports. `launchcheck` bets on **speed (< 10s), zero-config execution (`npx`), emotional resonance (roast mode), and high shareability (PNG cards, HTML reports, Agent prompts)** to carve out its niche.

## 2. Strengths & Market Fit
- **Frictionless Onboarding:** By running via `npx launchcheck <url>`, the time-to-value is seconds. This is critical for adoption.
- **The "Agent-Ready" Fix Prompt:** Generating a `FIXES.md` specifically formatted for Cursor, Claude, or Antigravity is a brilliant, forward-looking feature. It bridges the gap between *finding* the problem and *fixing* it in the age of AI coding assistants.
- **Viral Mechanics (Shareability):** The PNG score card (`--card`) and HTML report (`--html`) create built-in marketing. When users share their "A+" score (or a funny roasted "F" score) on X/LinkedIn, the tool markets itself.
- **Personality (Roast Mode):** Adding a playful, snarky "roast" mode makes the tool memorable and gives it a distinct voice compared to the sterile outputs of Google PageSpeed Insights.

## 3. Brainstorming & Expansions

### A. Expanding the Check Catalog
While the initial 35+ checks are solid, here are a few high-value additions for the roadmap:
*   **Basic Accessibility (a11y):** While full a11y needs a browser, static checks can verify `aria-label` on buttons without text, `<label>` presence for inputs, and structural HTML5 tags (`<main>`, `<nav>`).
*   **Dark Mode Support:** Check for `@media (prefers-color-scheme: dark)` in inline styles or linked CSS, or a `color-scheme` meta tag. 
*   **RSS/Atom Feed Detection:** Helpful for blogs and content sites (`<link rel="alternate" type="application/rss+xml">`).

### B. Evolving the Agent Workflow (`--auto-fix`)
The `--fix` prompt is great, but what if `launchcheck` could close the loop entirely?
*   **Local Repo Scanning:** If `launchcheck` is run inside a local repository (e.g., `npx launchcheck .`), it could parse the local files (like `next.config.js` or `index.html`) and *automatically apply the fixes* using an embedded AI or AST transformation.

### C. Roast Mode Enhancements
*   **Contextual AI Roasts (Opt-in):** While rule-based templates are fast and safe, an opt-in `--ai` flag could fetch a personalized roast from a lightweight LLM using the site's actual `<title>` and `<meta>` description. (e.g., *"You call yourself a 'Premium SaaS', but your TLS certificate expires tomorrow. Big yikes."*)
*   **Roast Themes:** Let users choose the flavor of the roast (e.g., `Gordon Ramsay`, `Disappointed Parent`, `Tech Bro`).

### D. Ecosystem & Distribution
*   **GitHub PR Bot:** A GitHub app that runs on Vercel/Netlify preview deployments and comments the Score Card + Roast directly on the PR. 
*   **Browser Extension (V2):** While the CLI is the core, a lightweight Chrome extension that runs the same logic could capture the less terminal-savvy audience.

## 4. Technical Architecture Review
*   **CLI Library:** The report mentions `cac` vs `commander`. **Recommendation:** Use `cac`. It is lighter and faster, fitting the "speed" ethos of the tool perfectly.
*   **Rendering the TUI:** `Ink` is the right choice for complex, live-updating terminal UIs. 
*   **Card Rendering:** `satori` + `@resvg/resvg-js` is an excellent, headless-browser-free way to generate images quickly.
*   **Bundling:** `tsup` is standard and extremely fast for Node CLIs.

## 5. Execution Strategy & Risk Mitigation
*   **The "Empty Shell" Problem:** As noted, pure SPAs (React without SSR) will return almost empty HTML to `cheerio`. The tool *must* fail gracefully here, instantly detecting the SPA structure and displaying a clear warning (e.g., *"Client-side rendering detected. Some SEO checks skipped. Use --browser (coming soon)."*) rather than giving a false "F" grade.
*   **Scope Creep:** The 5-day MVP timeline is aggressive. To hit this, the team must strictly adhere to the static-only (no Playwright) approach for V1 and rely entirely on `cheerio` and basic `fetch`.

## Conclusion
`launchcheck` is a highly viable product idea with a clear wedge in the market. Its focus on developer experience, AI-readiness, and shareability positions it perfectly for the current web development landscape. The immediate next step should be validating the npm package name and prototyping the Ink UI with 5 hardcoded checks to prove the "10-second" speed claim.
