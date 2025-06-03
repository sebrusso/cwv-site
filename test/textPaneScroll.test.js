import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "fs";
import path from "path";
import ts from "typescript";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function loadTextPane() {
  const tsPath = "src/components/TextPane.tsx";
  let src = fs.readFileSync(tsPath, "utf8");
  src = src.replace("@/lib/text-utils", "./text-utils.cjs");
  const compiled = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020", jsx: "react" } }).outputText;
  const outDir = path.join(".test-tmp");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, "TextPane.cjs");
  fs.writeFileSync(outPath, compiled);
  const utilsSrc = fs.readFileSync("src/lib/text-utils.js", "utf8");
  const utilsCompiled = ts.transpileModule(utilsSrc, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  fs.writeFileSync(path.join(outDir, "text-utils.cjs"), utilsCompiled);
  return require(path.resolve(outPath));
}

const { syncScroll } = loadTextPane();

test("dest pane not scrollable", () => {
  const src = { scrollTop: 10, scrollHeight: 100, clientHeight: 50 };
  const dest = { scrollTop: 5, scrollHeight: 30, clientHeight: 30 };
  syncScroll(src, dest);
  assert.equal(dest.scrollTop, 5);
});

test("source pane not scrollable", () => {
  const src = { scrollTop: 10, scrollHeight: 20, clientHeight: 20 };
  const dest = { scrollTop: 8, scrollHeight: 100, clientHeight: 60 };
  syncScroll(src, dest);
  assert.equal(dest.scrollTop, 8);
});
