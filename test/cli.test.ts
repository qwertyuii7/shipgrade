import { describe, it, expect } from "vitest";
import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);
const cliPath = path.resolve(__dirname, "../src/cli.ts");

describe("CLI Integration Tests", () => {
  it("should exit with code 0 on a normal run", async () => {
    const { stdout, stderr } = await execAsync(`npx tsx ${cliPath} https://example.com --quiet`);
    expect(stdout).toContain("shipgrade"); 
    expect(stderr).toBe("");
  });

  it("should exit with code 1 if score is under --fail-under", async () => {
    try {
      // example.com scores around 71, so fail-under 90 should fail
      await execAsync(`npx tsx ${cliPath} https://example.com --fail-under 90`);
      expect.unreachable("Command should have failed");
    } catch (err: any) {
      expect(err.code).toBe(1);
    }
  });

  it("should exit with code 2 or 1 if the tool errors (e.g. invalid URL)", async () => {
    try {
      await execAsync(`npx tsx ${cliPath} http://this-domain-definitely-does-not-exist-1234.com`);
      expect.unreachable("Command should have failed");
    } catch (err: any) {
      expect(err.code).toBe(1); // the cli exits with 1 on fetch error
      expect(err.stderr).toContain("Failed to fetch");
    }
  });
});
