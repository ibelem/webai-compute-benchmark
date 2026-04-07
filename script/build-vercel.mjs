// Copyright 2026 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd
//
// Vercel build script: builds all workloads without downloading models locally.
// Self-contained — does not import helper.mjs to avoid devDependency issues
// when Vercel installs only production dependencies (NODE_ENV=production).

import { spawn } from "child_process";
import fs from "node:fs";

function log(msg) {
  console.log(msg);
}

function sh(args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`> ${args.join(" ")}`);
    const child = spawn(args[0], args.slice(1), {
      stdio: "inherit",
      cwd: options.cwd,
      env: { ...process.env },
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${args.join(" ")}" exited with ${code}`));
      }
    });
    child.on("error", reject);
  });
}

// Workload directories that need to be built.
// Hardcoded to avoid importing default-tests.mjs (and its dependency chain)
// which would require devDependencies unavailable on Vercel.
const workloadDirs = [
  "resources/transformers-js",
  "resources/litert-js",
  "resources/experimental",
];

log(`BUILDING ${workloadDirs.length} WORKLOADS (Vercel / no model download)`);
for (const dir of workloadDirs) {
  log(`  - ${dir}`);
}

for (const dir of workloadDirs) {
  log(`\n${"=".repeat(60)}\nBUILDING: ${dir}\n${"=".repeat(60)}`);
  await sh(["npm", "install", "--prefer-offline"], {cwd: dir});
  // Use build:vercel to skip the prebuild model-download step.
  await sh(["npm", "run", "build:vercel"], {cwd: dir});
}

log("\nBuild complete.");
