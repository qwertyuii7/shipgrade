#!/usr/bin/env node
import cac from "cac";
import React from "react";
import { render } from "ink";
import { fetchContext } from "./context/fetcher.js";
import { runChecks } from "./runner.js";
import { checks } from "./checks/index.js";
import { calculateScore } from "./score.js";
import { App } from "./ui/App.js";
import { generateHtmlReport } from "./report/html.js";
import { generateAgentFixPrompt } from "./report/agent.js";
import { generateScoreCard } from "./report/card.js";
import { playBanner, shouldShowBanner } from "./ui/banner.js";
import { META } from "./meta.js";

import { exec } from "child_process";
import { generatePdfReport } from "./report/pdf.js";

function openFile(filePath: string) {
  const platform = process.platform;
  let command = "";
  if (platform === "win32") {
    command = `start "" "${filePath}"`;
  } else if (platform === "darwin") {
    command = `open "${filePath}"`;
  } else {
    command = `xdg-open "${filePath}"`;
  }
  exec(command);
}

const cli = cac(META.bin);

cli
  .command("[url]", `Audit a website for ${META.name} readiness`)
  .option("--json", "Output as JSON")
  .option("--roast [intensity]", "Include a playful roast (savage)")
  .option("--fail-under <score>", "Fail if score is under threshold")
  .option("--html <file>", "Generate HTML report")
  .option("--pdf [file]", "Generate detailed PDF report")
  .option("--browser <path>", "Path to Chrome/Edge binary for PDF")
  .option("--card <file>", "Generate PNG score card")
  .option("--fix", "Generate FIXES.md prompt for AI agents")
  .option("--open", "Automatically open the generated HTML/PDF/Card")
  .option("--quiet", "Suppress visual output (banner, etc)")
  .option("--force", "Force run checks even if blocked or status is non-2xx")
  .action(async (url: string | undefined, options) => {
    if (!url) {
      cli.outputHelp();
      process.exit(2);
    }

    if (!options.json && shouldShowBanner({ json: options.json, quiet: options.quiet })) {
      // Banner needs checks.length, let's just pass a default 36 since we added a check
      await playBanner({ version: META.version, url, checks: 36, categories: 6, roast: !!options.roast });
    }

    try {
      const ctx = await fetchContext(url);

      // Block Detection
      if (!options.force) {
        let blockReason = "";
        
        const isJustAMoment = ctx.html.includes("Just a moment");
        const titleText = ctx.$("title").text();
        const cfMitigated = ctx.headers.get("cf-mitigated");
        
        if ((ctx.status === 403 || ctx.status === 429 || ctx.status === 503 || titleText.includes("Just a moment")) && (isJustAMoment || cfMitigated)) {
          blockReason = `blocked (cloudflare challenge)`;
        } else if (ctx.status === 401) blockReason = "needs auth (401)";
        else if (ctx.status === 403 || ctx.status === 429) blockReason = `blocked (${ctx.status})`;
        else if (ctx.status === 404) blockReason = "not found (404)";
        else if (ctx.status >= 500) blockReason = `server error (${ctx.status})`;
        else if (ctx.status < 200 || ctx.status >= 300) blockReason = `unexpected status (${ctx.status})`;

        if (blockReason) {
          if (options.json) {
            console.log(JSON.stringify({ error: blockReason, status: ctx.status }));
          } else {
            console.error(`\n❌ Error: ${blockReason}. Use --force to score anyway.`);
          }
          process.exit(2);
        }
      }

      if (!options.json && ctx.isSPA) {
        console.error(`\n⚠️  Warning: Client-rendered SPA detected. Some DOM-dependent checks have been skipped because results would be unreliable.\n`);
      }

      const results = await runChecks(ctx);
      const scoreData = calculateScore(results, ctx.status);

      const report = {
        url: ctx.url,
        finalUrl: ctx.finalUrl,
        scannedAt: new Date().toISOString(),
        tool: { name: META.name, version: META.version, schemaVersion: META.schemaVersion },
        ...scoreData
      };

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      let generatedFiles: string[] = [];

      if (options.html) {
        generateHtmlReport(report, options.html);
        generatedFiles.push(options.html);
      }
      if (options.pdf) {
        const pdfFile = typeof options.pdf === 'string' ? options.pdf : `shipgrade-report.pdf`;
        const { generateHtmlString } = await import("./report/html.js");
        const htmlStr = generateHtmlString(report);
        await generatePdfReport(htmlStr, pdfFile, options.browser);
        generatedFiles.push(pdfFile);
      }
      if (options.fix) {
        generateAgentFixPrompt(report, "FIXES.md");
      }
      if (options.card) {
        await generateScoreCard(report, options.card);
        generatedFiles.push(options.card);
      }

      if (options.open) {
        for (const file of generatedFiles) {
          openFile(file);
        }
      }

      render(React.createElement(App, { report, roastMode: !!options.roast }));

      if (options.failUnder && report.score < Number(options.failUnder)) {
        process.exit(1);
      }
    } catch (err: any) {
      const code = err.cause?.code || err.cause?.cause?.code || "";
      const msg = code ? `${err.message} (${code})` : err.message;
      if (options.json) {
        console.log(JSON.stringify({ error: msg, status: 0 }));
      } else {
        console.error(`\n❌ Error: ${msg}`);
      }
      process.exit(2);
    }
  });

cli.help();
// Import package.json dynamically or use META.version. We already have META.version.
cli.version(META.version);

cli.parse();
