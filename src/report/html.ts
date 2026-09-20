import fs from "fs";
import { Report } from "../types.js";
import { generateRoast } from "../roast/index.js";
import { META } from "../meta.js";

export function generateHtmlReport(report: Report, outputPath: string) {
  const allResults = Object.values(report.categories).flatMap((c) => c.results);
  const failed = allResults.filter((r) => r.status === "fail" || r.status === "warn");
  const roast = generateRoast(report.score, failed);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${META.name} Report - ${report.url}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
    .score-card { background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .score { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .score.good { color: #28a745; }
    .score.warn { color: #ffc107; }
    .score.bad { color: #dc3545; }
    .roast { font-style: italic; color: #666; margin-top: 10px; }
    .fix-list { list-style: none; padding: 0; }
    .fix-item { background: #fff; border: 1px solid #eee; margin-bottom: 10px; padding: 15px; border-radius: 6px; }
    .fix-id { font-size: 0.85em; color: #666; text-transform: uppercase; }
  </style>
</head>
<body>
  <h1>🚀 ${META.name} Report</h1>

  <p><strong>Target:</strong> <a href="${report.finalUrl}">${report.finalUrl}</a></p>
  
  <div class="score-card">
    <div class="score ${report.score >= 80 ? 'good' : report.score >= 55 ? 'warn' : 'bad'}">
      ${report.score} / 100 (Grade ${report.grade})
    </div>
    <div class="roast">🔥 ${roast}</div>
  </div>

  <h2>Top Fixes</h2>
  <ul class="fix-list">
    ${report.topFixes.map(f => `
      <li class="fix-item">
        <div class="fix-id">[${f.id}]</div>
        <strong>${f.message}</strong>
        <p>💡 <em>How to fix:</em> ${f.fix}</p>
      </li>
    `).join("")}
  </ul>
</body>
</html>`;

  fs.writeFileSync(outputPath, html.trim(), "utf-8");
}
