import { CheckResult } from "../types.js";

export function generateRoast(score: number, failedChecks: CheckResult[]): string {
  if (score >= 95) {
    return "Actually... not bad. I couldn't find much to complain about. Ship it.";
  }
  
  if (score >= 80) {
    return "Decent effort, but still rough around the edges. Did you skip coffee today?";
  }
  
  if (score >= 50) {
    return "This is basically the duct tape and WD-40 of websites. Barely holding together.";
  }
  
  return "I've seen 404 pages with better SEO and structure than this. Please fix the red before sharing this link.";
}
