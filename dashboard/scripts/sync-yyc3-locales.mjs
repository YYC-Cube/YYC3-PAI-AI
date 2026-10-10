#!/usr/bin/env node
/**
 * Sync YYC³ language packs from the independent YYC3-i18n-Core repo
 * (npm: @yyc3/i18n-core) into dashboard bundle JSONs.
 *
 * Usage: npm run sync:yyc3-locales
 *
 * Source resolution order:
 *   1. $YYC3_I18N_CORE (path to the YYC3-i18n-Core checkout)
 *   2. ~/YYC-Cube/YYC3-i18n-Core (authoritative publish source)
 *   3. ../../YanYuCloudCube/YYC3-i18n-Core (archived mirror, fallback)
 *
 * Generated files land in dashboard/src/locales/yyc3/<locale>.json and are
 * committed so the app builds without the sibling repo present.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const candidates = [
  process.env.YYC3_I18N_CORE,
  // Authoritative publish source (github: YYC-Cube/YYC3-i18n-Core)
  path.resolve(process.env.HOME ?? "/Users/yanyu", "YYC-Cube/YYC3-i18n-Core"),
  // Archived mirror fallback: scripts -> dashboard -> YYC3-Pai -> YYC-Cube
  // -> YYC3-GitHub -> YanYuCloudCube
  path.resolve(
    import.meta.dirname,
    "../../../../YanYuCloudCube/YYC3-i18n-Core",
  ),
].filter(Boolean);

const coreRoot = candidates.find((p) =>
  existsSync(path.join(p, "src", "locales")),
);
if (!coreRoot) {
  console.error(
    "YYC3-i18n-Core repo not found. Set YYC3_I18N_CORE to its checkout path.",
  );
  process.exit(1);
}

const srcDir = path.join(coreRoot, "src", "locales");
const outDir = path.resolve(import.meta.dirname, "../src/locales/yyc3");
await mkdir(outDir, { recursive: true });

const files = (await readdir(srcDir)).filter((f) => f.endsWith(".ts"));
for (const file of files) {
  const mod = await import(pathToFileURL(path.join(srcDir, file)).href);
  const exportKey = Object.keys(mod)[0];
  const table = mod[exportKey];
  const locale = file.replace(/\.ts$/, "");
  const isEmpty = typeof table !== "object" || table === null;
  const table2 = isEmpty ? {} : table;
  const json = `${JSON.stringify(table2, null, 2)}\n`;
  await writeFile(path.join(outDir, `${locale}.json`), json, "utf8");
  console.log(
    isEmpty
      ? `synced ${locale} (placeholder -> empty bundle, i18next falls back to en)`
      : `synced ${locale} (${Object.keys(table).length} namespaces)`,
  );
}

console.log(`done: ${files.length} packs -> ${outDir}`);
