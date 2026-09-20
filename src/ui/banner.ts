/**
 * launchcheck: startup banner (zero dependencies)
 *
 * Neofetch-style splash: rocket + big slash lettering + info column.
 * Adapts to terminal width and color support, and animates line by line.
 *
 * Usage (in cli.ts, before you render the Ink UI):
 *
 *   import { playBanner, shouldShowBanner } from "./ui/banner.js";
 *   if (shouldShowBanner({ json: flags.json, quiet: flags.quiet, noBanner: !flags.banner })) {
 *     await playBanner({ version: pkg.version, url, checks: 36, roast: flags.roast });
 *   }
 */

import { META } from "../meta.js";

const SLANT = [
  "         __    _                            __      __            _           ",
  "   _____/ /_  (_)___  ____ __________ _____/ /__   / /_____ ___  (_)___  __  _______",
  "  / ___/ __ \\/ / __ \\/ __ `/ ___/ __ `/ __  / _ \\ / __/ __ `__ \\/ / __ \\/ / / / ___/",
  " (__  ) / / / / /_/ / /_/ / /  / /_/ / /_/ /  __// /_/ / / / / / / / / / /_/ (__  )",
  "/____/_/ /_/_/ .___/\\__, /_/   \\__,_/\\__,_/\\___/ \\__/_/ /_/ /_/_/_/ /_/\\__,_/____/",
  "            /_/    /____/                                                         "
];

const SMALL_SLANT = SLANT; // Fallback to same if small isn't provided


// 12 columns wide. Rows from FLAME_FROM down are drawn as exhaust flames.
const ROCKET = [
  "     /\\     ",
  "    /  \\    ",
  "   |    |   ",
  "   | () |   ",
  "   |    |   ",
  "  /|    |\\  ",
  " / |    | \\ ",
  "/__|____|__\\",
  "   /_/\\_\\   ",
  "    \\||/    ",
  "     \\/     ",
];
const FLAME_FROM = 9;
const GAP = 3;

// ───────────────────────────── colors ─────────────────────────────

type RGB = [number, number, number];
/** 0 = no color, 1 = basic 16-color ANSI, 3 = truecolor (24-bit) */
export type ColorLevel = 0 | 1 | 3;

const STOPS: RGB[] = [
  [255, 140, 50], // orange
  [236, 72, 153], // pink
  [34, 211, 238], // cyan
];
const RESET = "\x1b[0m";

export function detectColorLevel(): ColorLevel {
  const e = process.env;
  if (e.NO_COLOR !== undefined || e.TERM === "dumb" || e.FORCE_COLOR === "0") return 0;
  if (!process.stdout.isTTY && !e.FORCE_COLOR) return 0;
  const ct = (e.COLORTERM ?? "").toLowerCase();
  if (ct === "truecolor" || ct === "24bit" || e.WT_SESSION) return 3;
  return 1;
}

const lerp = (a: RGB, b: RGB, t: number): RGB =>
  [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;

function gradient(t: number): RGB {
  const seg = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(seg), STOPS.length - 2);
  return lerp(STOPS[i], STOPS[i + 1], seg - i);
}

function paint(s: string, level: ColorLevel, rgb: RGB, ansi: number, bold = false): string {
  if (level === 0 || s.trim() === "") return s;
  const b = bold ? "\x1b[1m" : "";
  return level === 3
    ? `${b}\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m${s}${RESET}`
    : `${b}\x1b[${ansi}m${s}${RESET}`;
}

/** Horizontal orange → pink → cyan gradient across the logo. */
function gradientLine(line: string, width: number, level: ColorLevel): string {
  if (level === 0) return line;
  if (level === 1) return paint(line, 1, [0, 0, 0], 36, true);
  let out = "";
  for (let x = 0; x < line.length; x++) {
    const ch = line[x];
    out += ch === " " ? ch : paint(ch, 3, gradient(x / Math.max(width - 1, 1)), 0);
  }
  return out;
}

function rocketLine(row: number, line: string, level: ColorLevel): string {
  if (level === 0) return line;
  let out = "";
  for (const ch of line) {
    if (ch === " ") out += ch;
    else if (row >= FLAME_FROM)
      out += row === FLAME_FROM ? paint(ch, level, [255, 190, 60], 33) : paint(ch, level, [255, 90, 40], 31);
    else if (ch === "(" || ch === ")") out += paint(ch, level, [34, 211, 238], 36);
    else out += paint(ch, level, [226, 232, 240], 97);
  }
  return out;
}

// ───────────────────────────── layout ─────────────────────────────

export interface BannerOptions {
  version: string;
  url?: string;
  checks?: number;
  categories?: number;
  roast?: boolean;
  /** Defaults to the terminal width (or 80). */
  columns?: number;
  /** Defaults to auto-detection (NO_COLOR, TTY, COLORTERM). */
  color?: ColorLevel;
}

const maxWidth = (lines: string[]) => Math.max(...lines.map((l) => l.length));
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, Math.max(n - 3, 1)) + "..." : s);

function tagline(o: BannerOptions, level: ColorLevel): string {
  return (
    paint(META.name, level, [255, 255, 255], 97, true) +
    paint(` v${o.version}`, level, [148, 163, 184], 90) +
    paint("  ship-ready in one command", level, [148, 163, 184], 90)
  );
}

function infoRows(o: BannerOptions, room: number, level: ColorLevel): string[] {
  const keyW = 9;
  const rows: [string, string][] = [
    ["target", o.url ?? "(pass a URL)"],
    ["checks", `${o.checks ?? 35} across ${o.categories ?? 6} categories`],
    ["mode", o.roast ? "roast" : "standard"],
    ["runtime", `node ${process.version}`],
  ];
  return rows.map(
    ([k, v]) => paint(k.padEnd(keyW), level, [236, 72, 153], 35, true) + truncate(v, Math.max(room - keyW, 8)),
  );
}

/** Returns the banner as an array of lines (pure function, easy to test). */
export function renderBanner(o: BannerOptions): string[] {
  const cols = o.columns ?? process.stdout.columns ?? 80;
  const level = o.color ?? detectColorLevel();
  const logoW = maxWidth(SLANT);
  const rocketW = maxWidth(ROCKET);

  // Full layout: rocket + big lettering + info column
  if (cols >= rocketW + GAP + logoW) {
    const right = [
      "",
      ...SLANT.map((l) => gradientLine(l.padEnd(logoW), logoW, level)),
      "",
      tagline(o, level),
      paint("─".repeat(logoW), level, [71, 85, 105], 90),
      ...infoRows(o, cols - rocketW - GAP, level),
    ];
    const rows = Math.max(ROCKET.length, right.length);
    return Array.from({ length: rows }, (_, i) => {
      const left = i < ROCKET.length ? rocketLine(i, ROCKET[i], level) : " ".repeat(rocketW);
      return (left + " ".repeat(GAP) + (right[i] ?? "")).trimEnd();
    });
  }

  // Compact layout: smaller lettering, no rocket
  const smallW = maxWidth(SMALL_SLANT);
  if (cols >= smallW) {
    return [
      "",
      ...SMALL_SLANT.map((l) => gradientLine(l.padEnd(smallW), smallW, level).trimEnd()),
      "",
      tagline(o, level),
      ...(o.url ? [truncate(o.url, cols)] : []),
    ];
  }

  // Minimal layout: one line
  return [paint("/\\ ", level, [255, 140, 50], 33, true) + tagline(o, level)];
}

// ───────────────────────────── playback ─────────────────────────────

/** Skip the banner for machine-readable or non-interactive runs. */
export function shouldShowBanner(f: { json?: boolean; quiet?: boolean; noBanner?: boolean } = {}): boolean {
  return !f.json && !f.quiet && !f.noBanner && !!process.stdout.isTTY && !process.env.CI;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Prints the banner, revealing it line by line (about 0.3 s total). */
export async function playBanner(o: BannerOptions & { animate?: boolean; delayMs?: number }): Promise<void> {
  const lines = renderBanner(o);
  const animate = o.animate ?? (!!process.stdout.isTTY && !process.env.CI);
  for (const line of lines) {
    process.stdout.write(line + "\n");
    if (animate) await sleep(o.delayMs ?? 25);
  }
  process.stdout.write("\n");
}
