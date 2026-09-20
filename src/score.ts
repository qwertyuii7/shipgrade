import { CheckResult, Check } from "./types.js";
import { checks } from "./checks/index.js";

const CATEGORY_WEIGHTS: Record<string, number> = {
  seo: 35,
  security: 20,
  perf: 25,
  social: 10,
  mobile: 5,
  reliability: 5,
};

function getStatusValue(status: string): number {
  if (status === "pass") return 1;
  if (status === "warn") return 0.5;
  if (status === "fail") return 0;
  return -1; // skip / info
}

export function calculateScore(results: (CheckResult & { id: string })[]) {
  const categories: Record<string, { score: number; results: (CheckResult & { id: string })[] }> = {};
  
  // Group results by category
  for (const res of results) {
    const checkDef = checks.find((c) => c.id === res.id);
    if (!checkDef) continue;

    const cat = checkDef.category;
    if (!categories[cat]) {
      categories[cat] = { score: 0, results: [] };
    }
    categories[cat].results.push(res);
  }

  let totalWeightedScore = 0;
  let totalPossibleWeight = 0;

  // Calculate category scores
  for (const cat of Object.keys(categories)) {
    const catData = categories[cat];
    let catAchieved = 0;
    let catPossible = 0;

    for (const res of catData.results) {
      const checkDef = checks.find((c) => c.id === res.id);
      const val = getStatusValue(res.status);
      if (val >= 0 && checkDef) {
        catAchieved += val * checkDef.weight;
        catPossible += checkDef.weight;
      }
    }

    if (catPossible > 0) {
      catData.score = (catAchieved / catPossible) * 100;
      const catWeight = CATEGORY_WEIGHTS[cat] || 0;
      totalWeightedScore += (catData.score / 100) * catWeight;
      totalPossibleWeight += catWeight;
    }
  }

  let overallScore = 0;
  if (totalPossibleWeight > 0) {
    overallScore = Math.round((totalWeightedScore / totalPossibleWeight) * 100);
  }

  // Determine grade
  let grade = "F";
  if (overallScore >= 95) grade = "A+";
  else if (overallScore >= 90) grade = "A";
  else if (overallScore >= 80) grade = "B";
  else if (overallScore >= 70) grade = "C";
  else if (overallScore >= 55) grade = "D";

  // Top fixes
  const fixes = results
    .filter((r) => r.status === "fail" || r.status === "warn")
    .map((r) => {
      const def = checks.find((c) => c.id === r.id);
      const val = getStatusValue(r.status);
      const impact = def ? def.weight * (1 - val) : 0;
      return { ...r, impact };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)
    .map((r) => ({ id: r.id, message: r.message, fix: r.fix || "" }));

  return {
    score: overallScore,
    grade,
    categories,
    topFixes: fixes,
  };
}
