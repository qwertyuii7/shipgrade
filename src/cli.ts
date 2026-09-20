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

const cli = cac(META.bin);

cli
  .command("<url>", `Audit a website for ${META.name} readiness`)
  .option("--json", "Output as JSON")
  .option("--roast [intensity]", "Include a playful roast (savage)")
  .option("--fail-under <score>", "Fail if score is under threshold")
  .option("--html <file>", "Generate HTML report")
  .option("--card <file>", "Generate PNG score card")
  .option("--fix", "Generate FIXES.md prompt for AI agents")
  .option("--quiet", "Suppress visual output (banner, etc)")
  .action(async (url: string, options) => {
    if (shouldShowBanner({ json: options.json, quiet: options.quiet })) {
      await playBanner({ version: META.version, url, checks: checks.length, categories: 6, roast: !!options.roast });
    }

    try {
      const ctx = await fetchContext(url);
      const results = await runChecks(ctx);
      const scoreData = calculateScore(results);

      const report = {
        url: ctx.url,
        finalUrl: ctx.finalUrl,
        scannedAt: new Date().toISOString(),
        tool: { name: META.name, version: META.version },
        ...scoreData
      };

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (options.html) {
        generateHtmlReport(report, options.html);
      }
      if (options.fix) {
        generateAgentFixPrompt(report, "FIXES.md");
      }
      if (options.card) {
        await generateScoreCard(report, options.card);
      }

      render(React.createElement(App, { report, roastMode: !!options.roast }));

      if (options.failUnder && report.score < Number(options.failUnder)) {
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

cli.help();
cli.version("1.0.0");

cli.parse();
