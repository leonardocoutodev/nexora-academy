import fs from "node:fs";
import path from "node:path";

const raw=String(process.env.WORKERS_CI_COMMIT_SHA||process.env.GITHUB_SHA||process.env.LC_BUILD_ID||"").trim();
const build=/^[0-9a-f]{40}$/i.test(raw)?raw:"unstamped";
const target=path.resolve("src/build-id.js");
fs.writeFileSync(target,`export const LC_SOURCE_BUILD_ID=${JSON.stringify(build)};\n`);
console.log(`LC build stamp: ${build}`);
