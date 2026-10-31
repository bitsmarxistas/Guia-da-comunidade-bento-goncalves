import sharp from "sharp";
import { readFileSync } from "node:fs";

/**
 * Gera o apple-touch-icon (180x180) a partir do mesmo símbolo do `icon.svg`.
 * Rodar só quando a marca mudar:  npx tsx scripts/gerar-apple-icon.ts
 */
async function main() {
  const svg = readFileSync("src/app/icon.svg");
  await sharp(svg, { density: 600 })
    .resize(180, 180)
    .png()
    .toFile("src/app/apple-icon.png");
  console.log("src/app/apple-icon.png gerado (180x180)");
}

void main();
