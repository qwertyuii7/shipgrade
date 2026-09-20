export type Status = "pass" | "warn" | "fail" | "skip" | "info";

export interface Context {
  url: string;
  finalUrl: string;
  status: number;
  html: string;
  headers: Headers;
  timing: {
    ttfb: number;
    total: number;
  };
}

export interface CheckResult {
  status: Status;
  message: string;
  evidence?: string;
  fix?: string;
  docsUrl?: string;
}

export interface Check {
  id: string;
  category: "seo" | "social" | "security" | "mobile" | "perf" | "reliability";
  title: string;
  weight: 1 | 2 | 3 | 4 | 5;
  effort: "low" | "medium" | "high";
  run(ctx: Context): Promise<CheckResult>;
}

export interface Report {
  url: string;
  finalUrl: string;
  scannedAt: string;
  tool: { name: string; version: string };
  score: number;
  grade: string;
  categories: Record<
    string,
    { score: number; results: (CheckResult & { id: string })[] }
  >;
  topFixes: { id: string; message: string; fix: string }[];
  framework?: "next" | "nuxt" | "astro" | "wordpress" | "unknown";
}
