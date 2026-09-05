import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const source = "https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=Playfair+Display:wght@400..800&display=swap";
const response = await fetch(source, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" } });
if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
const css = await response.text();
const dir = "public/assets/fonts";
await mkdir(dir, { recursive: true });
const blocks = [];
for (const match of css.matchAll(/\/\* (vietnamese|latin) \*\/\s*(@font-face \{[\s\S]*?\})/g)) {
  const [, subset, block] = match;
  const family = block.match(/font-family: '([^']+)'/)[1];
  const url = block.match(/url\(([^)]+)\)/)[1];
  const fontResponse = await fetch(url);
  if (!fontResponse.ok) throw new Error(`Font download: ${fontResponse.status}`);
  const data = Buffer.from(await fontResponse.arrayBuffer());
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 10);
  const filename = `${family.toLowerCase().replaceAll(" ", "-")}-${subset}-${hash}.woff2`;
  await writeFile(`${dir}/${filename}`, data);
  blocks.push(`/* ${family}: ${subset}; source: ${url} */\n${block.replace(url, `/assets/fonts/${filename}`)}`);
  console.log(filename, data.length);
}
if (blocks.length !== 4) throw new Error("Expected Latin and Vietnamese subsets for both families");
await writeFile("src/styles/landing-fonts.css", `${blocks.join("\n\n")}\n`);
for (const font of ["inter", "playfairdisplay"]) {
  const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${font}/OFL.txt`);
  if (!license.ok) throw new Error(`Font license: ${license.status}`);
  await writeFile(`${dir}/${font}-OFL.txt`, await license.text());
}
