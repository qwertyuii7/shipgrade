<div align="center">

```text
         __    _                            __      __            _           
   _____/ /_  (_)___  ____ __________ _____/ /__   / /_____ ___  (_)___  __  _______
  / ___/ __ \/ / __ \/ __ `/ ___/ __ `/ __  / _ \ / __/ __ `__ \/ / __ \/ / / / ___/
 (__  ) / / / / /_/ / /_/ / /  / /_/ / /_/ /  __// /_/ / / / / / / / / / /_/ (__  )
/____/_/ /_/_/ .___/\__, /_/   \__,_/\__,_/\___/ \__/_/ /_/ /_/_/_/ /_/\__,_/____/
            /_/    /____/                                                         
```

**Zero-config launch-readiness terminal report**

[![npm version](https://img.shields.io/npm/v/shipgrade.svg)](https://npmjs.org/package/shipgrade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Don't launch into the void. Grade your site before you ship.

</div>

**`shipgrade`** is a lightning-fast, local-first CLI tool that aggressively audits your website's SEO, social metadata, security headers, and performance best practices. It runs instantly from your terminal and generates a beautiful, actionable scorecard.

## 🚀 Quickstart

You don't even need to install it. Just run it via `npx` against any URL:

```bash
npx shipgrade https://your-website.com
```

## ✨ Features

- **Blazing Fast**: Uses `cheerio` to parse HTML instantly. Gracefully degrades for client-rendered SPAs (React/Vite).
- **36 Core Checks**: Exhaustively validates everything from Open Graph images and Twitter cards to Content-Security-Policy headers and Time-to-First-Byte (TTFB).
- **Local First**: Runs entirely on your machine. No cloud subscriptions, no tracking, no rate limits.
- **AI Agent Ready**: Use the `--fix` flag to pipe actionable repair instructions straight into your favorite coding assistant (ChatGPT, Claude, etc).
- **CI/CD Integration**: Supports `--fail-under <score>` and `--quiet` for seamless pipeline integration to block bad deployments.
- **Reporting & Export**: Use `--html` to generate a static dashboard, `--pdf` to generate a PDF report (zero dependencies), or `--card` to generate a sleek `.png` scorecard for sharing.

## 🛠️ Options

```text
Usage:
  $ npx shipgrade <url>

Options:
  --json                    Output the raw results as JSON
  --roast                   Include a playful (and savage) roast of your code
  --html <file>             Generate a static HTML report dashboard
  --pdf <file>              Generate a comprehensive PDF report
  --card <file>             Generate a beautiful PNG score card
  --fix                     Generate a FIXES.md prompt for AI agents
  --force                   Bypass Cloudflare/403 blocks and score anyway
  -f, --fail-under <score>  Exit with code 1 if the score is below the threshold
  -q, --quiet               Suppress visual output (banner, etc) for clean CI logs
  -h, --help                Display this message
  -v, --version             Display version number
```

## 🔍 The 36 Checks Performed

**shipgrade** evaluates your site across six distinct categories, concurrently executing network probes with a strict concurrency limit to avoid overwhelming your server.

### SEO (Search Engine Optimization)
- Ensures your page is indexable (catches leaked `noindex` tags).
- Validates Title and Meta Description lengths.
- Ensures exactly one `<h1>` tag exists.
- Checks for Canonical tags and `lang` attributes.
- Scans all images for missing `alt` attributes.
- Probes `/robots.txt` and `/sitemap.xml` for availability.
- Detects Soft 404s by testing a randomized nonexistent path.
- **Link Sampler**: Tests up to 10 unique internal/external links to catch dead links (404s).

### Social (Metadata & Sharing)
- Validates Open Graph (`og:title`, `og:image`) and Twitter Card metadata.
- Ensures Open Graph images are absolute URLs.
- **Reachability Probes**: Makes network requests to ensure your `favicon` and `og:image` are actually reachable and not broken.

### Security
- Enforces HTTPS and catches mixed HTTP content on secure pages.
- Validates critical headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy`, `X-Frame-Options`, and `Referrer-Policy`.
- Flags tech stack leaks (e.g., exposed `X-Powered-By` or verbose `Server` headers).
- **TLS Probe**: Performs a low-level socket connection to verify SSL certificate validity and warns if it expires in less than 14 days.

### Performance
- Verifies gzip/brotli payload compression.
- Measures Server Response Time (TTFB).
- Scans for `Cache-Control` headers for static assets.
- Detects massive HTML document bloat (>100KB warns, >300KB fails).
- Flags images below the fold missing `loading="lazy"`.
- Flags `<script>` tags in the `<head>` missing `defer` or `async`.
- **Image Sampler**: Tests up to 10 image `src` URLs to catch broken assets (404s).

### Mobile & Reliability
- Validates Viewport scaling metadata.
- Verifies that `www.` and `non-www.` domain variants resolve and correctly redirect to a single canonical source to preserve SEO equity.

## 🤖 AI Agent Workflow

Run `npx shipgrade <url> --fix` to instantly generate a `FIXES.md` file in your directory. 

The output is perfectly formatted as an AI prompt. Just copy and paste it into ChatGPT, Claude, or GitHub Copilot, and the AI will instantly write the code needed to fix your top failing checks!

## ❓ Why shipgrade?

There are a lot of SEO and auditing tools out there (Lighthouse, Ahrefs, HubSpot's Website Grader). But **shipgrade** is built specifically for developers who want a quick, beautiful, terminal-native sanity check right before they click "Deploy." 

## License

MIT
