import { Check } from "../types.js";
import { seoChecks } from "./seo.js";
import { socialChecks } from "./social.js";
import { securityChecks } from "./security.js";
import { perfChecks } from "./perf.js";
import { mobileChecks } from "./mobile.js";
import { reliabilityChecks } from "./reliability.js";

export const checks: Check[] = [
  ...seoChecks,
  ...socialChecks,
  ...securityChecks,
  ...perfChecks,
  ...mobileChecks,
  ...reliabilityChecks,
];
