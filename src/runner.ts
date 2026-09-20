import pLimit from "p-limit";
import { Context, Check, CheckResult } from "./types.js";
import { checks } from "./checks/index.js";

export async function runChecks(ctx: Context): Promise<(CheckResult & { id: string })[]> {
  const limit = pLimit(10); // Run max 10 checks concurrently
  const results: (CheckResult & { id: string })[] = [];

  const DOM_DEPENDENT_CHECKS = new Set(["seo.h1", "seo.alt", "seo.links", "seo.jsonld", "perf.lazy", "perf.images"]);

  const promises = checks.map((check: Check) => 
    limit(async () => {
      if (ctx.isSPA && DOM_DEPENDENT_CHECKS.has(check.id)) {
        results.push({
          id: check.id,
          status: "skip",
          message: "Check skipped (Client-rendered SPA detected)",
        });
        return;
      }

      try {
        const result = await check.run(ctx);
        results.push({ ...result, id: check.id });
      } catch (err: any) {
        results.push({
          id: check.id,
          status: "skip",
          message: `Check failed to execute: ${err.message}`,
        });
      }
    })
  );

  await Promise.all(promises);
  return results;
}
