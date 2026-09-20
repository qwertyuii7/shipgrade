import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export function findBrowser(overridePath?: string): string | null {
  if (overridePath && fs.existsSync(overridePath)) return overridePath;
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;

  const platform = os.platform();
  let paths: string[] = [];

  if (platform === 'win32') {
    paths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
  } else if (platform === 'darwin') {
    paths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
  } else {
    paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/microsoft-edge',
    ];
  }

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function generatePdfReport(html: string, outputPath: string, browserOverride?: string) {
  const browserPath = findBrowser(browserOverride);
  
  if (!browserPath) {
    console.error("\n❌ Could not find a local installation of Chrome or Edge to generate the PDF.");
    console.error(`💡 Workaround: Run the tool with '--html report.html' instead, open it in your browser, and print it to PDF (Ctrl+P).\n`);
    process.exit(1);
  }

  // Create a temporary HTML file for the browser to read
  const tmpHtmlPath = path.join(os.tmpdir(), `shipgrade-pdf-${Date.now()}.html`);
  fs.writeFileSync(tmpHtmlPath, html, 'utf-8');

  try {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      `--print-to-pdf=${path.resolve(outputPath)}`,
      `file://${tmpHtmlPath}`
    ];
    await execFileAsync(browserPath, args);
  } finally {
    if (fs.existsSync(tmpHtmlPath)) {
      fs.unlinkSync(tmpHtmlPath);
    }
  }
}
