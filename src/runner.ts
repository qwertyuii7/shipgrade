import pLimit from "p-limit";
import { Context, Check, CheckResult } from "./types.js";
import { checks } from "./checks/index.js";

export async function runChecks(ctx: Context): Promise<(CheckResult & { id: string })[]> {
  const limit = pLimit(10); // Run max 10 checks concurrently
  const results: (CheckResult & { id: string })[] = [];

  const promises = checks.map((check: Check) => 
    limit(async () => {
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
