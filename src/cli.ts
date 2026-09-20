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
  .action(async (url: string | undefined, options) => {
    if (!url) {
      cli.outputHelp();
      process.exit(1);
    }

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
        
        // We need to generate the HTML string to feed to the PDF generator.
        // Let's refactor generateHtmlReport to return the HTML string or just recreate it.
        // Actually, generating a temporary HTML file or returning string is better.
        // For now, let's write to a temp file and read it back if we must, or we can just refactor html.ts quickly.
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
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  });

cli.help();
cli.version("1.0.0");

cli.parse();
