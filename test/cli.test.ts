import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import util from "util";
import path from "path";
import http from "http";

const execAsync = util.promisify(exec);
const cliPath = path.resolve(__dirname, "../src/cli.ts");

describe("CLI Integration Tests", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/403") {
        res.writeHead(403);
        res.end("Forbidden");
      } else if (req.url === "/cf-mitigated") {
        res.writeHead(503, { "cf-mitigated": "challenge" });
        res.end("Cloudflare challenge");
      } else if (req.url === "/just-a-moment") {
        res.writeHead(403);
        res.end("<html><head><title>Just a moment...</title></head><body>Just a moment...</body></html>");
      } else if (req.url === "/spa") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body><div id='root'></div><script src='app.js'></script></body></html>");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body><h1>Hello World</h1></body></html>");
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  it("should exit with code 0 on a normal run", async () => {
    const { stdout, stderr } = await execAsync(`npx tsx ${cliPath} http://localhost:${port}/ --quiet`);
    expect(stdout).toContain("shipgrade"); 
    expect(stderr).toBe("");
  });

  it("should warn on SPA detection", async () => {
    const { stderr } = await execAsync(`npx tsx ${cliPath} http://localhost:${port}/spa --quiet`);
    expect(stderr).toContain("Client-rendered SPA detected");
  });

  it("should exit with code 2 on 403 block", async () => {
    try {
      await execAsync(`npx tsx ${cliPath} http://localhost:${port}/403 --quiet`);
      expect.unreachable("Command should have failed");
    } catch (err: any) {
      expect(err.code).toBe(2);
      expect(err.stderr).toContain("blocked (403)");
    }
  });

  it("should exit with code 2 on cf-mitigated", async () => {
    try {
      await execAsync(`npx tsx ${cliPath} http://localhost:${port}/cf-mitigated --quiet`);
      expect.unreachable("Command should have failed");
    } catch (err: any) {
      expect(err.code).toBe(2);
      expect(err.stderr).toContain("blocked (cloudflare challenge)");
    }
  });

  it("should bypass block with --force", async () => {
    const { stdout, stderr } = await execAsync(`npx tsx ${cliPath} http://localhost:${port}/403 --quiet --force`);
    expect(stdout).toContain("shipgrade"); 
    // It runs successfully (code 0) despite the 403 because of --force
  });

  it("should exit with code 2 if the tool errors (e.g. invalid URL)", async () => {
    try {
      await execAsync(`npx tsx ${cliPath} http://this-domain-definitely-does-not-exist-1234.com`);
      expect.unreachable("Command should have failed");
    } catch (err: any) {
      expect(err.code).toBe(2);
      expect(err.stderr).toContain("Failed to fetch");
    }
  });
});
