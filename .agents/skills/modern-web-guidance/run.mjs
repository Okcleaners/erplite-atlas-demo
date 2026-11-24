// Run only reviewed, read-only commands with the repository's compatibility policy.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const cli = fileURLToPath(new URL("./node_modules/modern-web-guidance/skills/modern-web-guidance/modern-web.mjs", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
if (!["search", "retrieve", "list", "legacy-scan"].includes(args[0])) {
  console.error("Choose search, retrieve, list, or legacy-scan.");
  process.exitCode = 2;
} else if (!existsSync(cli)) {
  console.error("From the website root, run npm ci --prefix .agents/skills/modern-web-guidance --ignore-scripts --no-audit --no-fund");
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    env: { ...process.env, DISABLE_TELEMETRY: "1" },
    stdio: "inherit"
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
