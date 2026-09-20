import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import React from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { Report } from "../types.js";
import { META } from "../meta.js";

// Basic hack to resolve node_modules paths reliably in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateScoreCard(report: Report, outputPath: string) {
  // Try to find the font in node_modules
  let fontPath = path.resolve(__dirname, "../../node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff");
  if (!fs.existsSync(fontPath)) {
    // Fallback for different build structures
    fontPath = path.resolve(process.cwd(), "node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff");
  }
  
  const fontData = fs.readFileSync(fontPath);

  const color = report.score >= 80 ? "#28a745" : report.score >= 55 ? "#ffc107" : "#dc3545";

  const svg = await satori(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        fontFamily: '"Roboto"',
      }}
    >
      <div style={{ display: 'flex', fontSize: 40, color: '#aaa', marginBottom: 20 }}>
        {META.name}
      </div>
      <div style={{ display: 'flex', fontSize: 180, fontWeight: 'bold', color }}>
        {report.score}
      </div>
      <div style={{ display: 'flex', fontSize: 30, color: '#ccc', marginTop: 20 }}>
        {report.finalUrl}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Roboto',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    background: '#1a1a1a',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(outputPath, pngBuffer);
}
