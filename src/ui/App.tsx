import React from "react";
import { Box, Text } from "ink";
import { Report } from "../types.js";
import { generateRoast } from "../roast/index.js";
import { META } from "../meta.js";

interface AppProps {
  report: Report;
  roastMode: boolean;
}

export function App({ report, roastMode }: AppProps) {
  const allResults = Object.values(report.categories).flatMap((c) => c.results);
  const failed = allResults.filter((r) => r.status === "fail" || r.status === "warn");

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold>{META.name} v{META.version}</Text>
        <Text>   {report.finalUrl}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>─────────────────────────────────────────────────────────────────────</Text>
        
        {Object.keys(report.categories).map((cat) => (
          <Box key={cat}>
            <Box width={15}>
              <Text bold>{cat.toUpperCase()}</Text>
            </Box>
            <Box flexGrow={1}>
              {report.categories[cat].results.map((r) => {
                const icon = r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️" : r.status === "fail" ? "❌" : "➖";
                return (
                  <Box key={r.id} marginRight={2}>
                    <Text>{icon} {r.id.split(".")[1]}</Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}

        <Text dimColor>─────────────────────────────────────────────────────────────────────</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>SCORE   </Text>
        <Text color={report.score >= 80 ? "green" : report.score >= 55 ? "yellow" : "red"}>
          {"█".repeat(Math.round(report.score / 5))}
          {"░".repeat(20 - Math.round(report.score / 5))}
        </Text>
        <Text>   {report.score} / 100     GRADE </Text>
        <Text bold color={report.score >= 80 ? "green" : report.score >= 55 ? "yellow" : "red"}>{report.grade}</Text>
      </Box>

      {roastMode && (
        <Box marginBottom={1}>
          <Text italic color="magenta">🔥 Roast: {generateRoast(report.score, failed)}</Text>
        </Box>
      )}

      {report.topFixes.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>TOP FIXES</Text>
          {report.topFixes.map((f, i) => {
            const cat = f.id.split(".")[0].toUpperCase();
            return (
              <Box key={f.id} marginLeft={1}>
                <Box width={15}>
                  <Text>{i + 1}. [{cat}]</Text>
                </Box>
                <Box width={40}>
                  <Text>{f.message}</Text>
                </Box>
                <Text dimColor> → {f.fix}</Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
