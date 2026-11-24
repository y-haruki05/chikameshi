import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// OSのシェルによるglob展開に頼らず、追加したテストも自動で実行する。
function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findTests(path) : entry.name.endsWith(".test.ts") ? [path] : [];
  });
}
const tests = findTests("src").sort();
if (!tests.length) throw new Error("テストが見つかりません。");
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...tests], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
