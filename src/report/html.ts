import fs from "fs";
import { Report } from "../types.js";
import { generateRoast } from "../roast/index.js";
import { META } from "../meta.js";

// Strict HTML escaping to prevent XSS from malicious site data
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEffortColor(effort: string): string {
  if (effort === "low") return "#28a745"; // Green
  if (effort === "medium") return "#ffc107"; // Yellow
  return "#dc3545"; // Red
}

export function generateHtmlString(report: Report): string {
  const allResults = Object.values(report.categories).flatMap((c) => c.results);
  const failed = allResults.filter((r) => r.status === "fail" || r.status === "warn");
  const roast = generateRoast(report.score, failed);

  // Generate Per-Category Sections
  let categoryHtml = "";
  for (const [cat, data] of Object.entries(report.categories)) {
    categoryHtml += `
      <div class="category-section">
        <h2>${cat.toUpperCase()} (Score: ${Math.round(data.score)}%)</h2>
        ${data.results.map(r => `
          <div class="check-card ${r.status}">
            <div class="check-header">
              <span class="status-badge ${r.status}">${r.status.toUpperCase()}</span>
              <h3>${escapeHtml(r.id)}</h3>
            </div>
            <div class="check-body">
              <p><strong>Message:</strong> ${escapeHtml(r.message)}</p>
              ${r.evidence ? `<p><strong>Evidence:</strong> <code>${escapeHtml(r.evidence)}</code></p>` : ""}
              <p><strong>Why it matters:</strong> ${escapeHtml(r.why)}</p>
              ${r.fix ? `<p class="fix-advice">💡 <strong>How to fix:</strong> ${escapeHtml(r.fix)}</p>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
  <title>${META.name} Report - ${escapeHtml(report.url)}</title>
  <style>
    :root {
      --bg: #f8f9fa;
      --text: #333;
      --border: #ddd;
      --green: #28a745;
      --yellow: #ffc107;
      --red: #dc3545;
      --gray: #6c757d;
    }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 20px; 
      color: var(--text); 
    }
    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
    .score-card { 
      background: var(--bg); 
      border: 1px solid var(--border); 
      border-radius: 8px; 
      padding: 30px; 
      text-align: center; 
      margin: 20px 0; 
      page-break-inside: avoid;
    }
    .score { font-size: 64px; font-weight: bold; margin: 10px 0; line-height: 1; }
    .score.good { color: var(--green); }
    .score.warn { color: var(--yellow); }
    .score.bad { color: var(--red); }
    .roast { font-style: italic; color: var(--gray); margin-top: 15px; font-size: 1.1em; }
    
    .fix-list { list-style: none; padding: 0; }
    .fix-item { 
      background: #fff; 
      border: 1px solid var(--border); 
      border-left: 4px solid var(--red);
      margin-bottom: 15px; 
      padding: 15px; 
      border-radius: 6px; 
      page-break-inside: avoid;
    }
    .fix-meta { font-size: 0.85em; color: var(--gray); margin-bottom: 5px; display: flex; gap: 10px; }
    .effort-badge { padding: 2px 6px; border-radius: 4px; color: #fff; font-weight: bold; }
    
    .category-section { margin-top: 40px; page-break-before: always; }
    .category-section h2 { border-bottom: 2px solid var(--border); padding-bottom: 5px; }
    .check-card { 
      border: 1px solid var(--border); 
      border-radius: 6px; 
      margin-bottom: 15px; 
      padding: 15px;
      page-break-inside: avoid;
    }
    .check-card.pass { border-left: 4px solid var(--green); }
    .check-card.warn { border-left: 4px solid var(--yellow); }
    .check-card.fail { border-left: 4px solid var(--red); }
    .check-card.info, .check-card.skip { border-left: 4px solid var(--gray); }
    
    .check-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .check-header h3 { margin: 0; font-size: 1.1em; }
    .status-badge { 
      padding: 3px 8px; 
      border-radius: 4px; 
      font-size: 0.8em; 
      font-weight: bold; 
      color: #fff;
    }
    .status-badge.pass { background: var(--green); }
    .status-badge.warn { background: var(--yellow); color: #000; }
    .status-badge.fail { background: var(--red); }
    .status-badge.info, .status-badge.skip { background: var(--gray); }
    
    .check-body p { margin: 5px 0; font-size: 0.95em; }
    .fix-advice { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px !important; }
    code { background: #eee; padding: 2px 4px; border-radius: 3px; font-family: monospace; word-break: break-all; }
    
    .appendix { margin-top: 50px; font-size: 0.85em; color: var(--gray); border-top: 1px solid var(--border); padding-top: 20px; page-break-inside: avoid; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>🚀 ${META.name} Report</h1>
  <p><strong>Target:</strong> <a href="${escapeHtml(report.finalUrl)}">${escapeHtml(report.finalUrl)}</a></p>
  
  <div class="score-card">
    <div class="score ${report.score >= 80 ? 'good' : report.score >= 55 ? 'warn' : 'bad'}">
      ${report.score} / 100 <span style="font-size: 0.5em">(Grade ${escapeHtml(report.grade)})</span>
    </div>
    <div class="roast">🔥 ${escapeHtml(roast)}</div>
  </div>

  <h2>Executive Summary: Top Fixes</h2>
  ${report.topFixes.length === 0 ? '<p>No critical fixes needed. Great job!</p>' : `
  <ul class="fix-list">
    ${report.topFixes.map(f => `
      <li class="fix-item">
        <div class="fix-meta">
          <span>ID: <strong>${escapeHtml(f.id)}</strong></span>
          <span class="effort-badge" style="background: ${getEffortColor(f.effort)}">Effort: ${f.effort.toUpperCase()}</span>
        </div>
        <strong>${escapeHtml(f.message)}</strong>
        <p>💡 <em>How to fix:</em> ${escapeHtml(f.fix)}</p>
      </li>
    `).join("")}
  </ul>
  `}

  ${categoryHtml}

  <div class="appendix">
    <strong>Appendix & Methodology</strong><br>
    Generated by: ${META.name} v${META.version}<br>
    Timestamp: ${escapeHtml(report.scannedAt)}<br>
    Schema Version: ${META.schemaVersion}<br>
    <br>
    <em>This is a static analysis report. Results may differ from dynamic browser behavior.</em>
  </div>
</body>
</html>`;
}

export function generateHtmlReport(report: Report, outputPath: string) {
  const html = generateHtmlString(report);
  fs.writeFileSync(outputPath, html, "utf-8");
}
