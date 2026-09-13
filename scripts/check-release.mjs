// Verifies a release tag matches package.json, both server.json version fields, and a dated
// CHANGELOG section, so a mismatched release fails before anything is published.
// Usage: node scripts/check-release.mjs v0.3.0   (the Release workflow passes the pushed tag)

import { readFileSync } from "node:fs";

const tag = process.argv[2] ?? "";
const version = tag.replace(/^v/, "");

if (!/^\d+\.\d+\.\d+/.test(version)) {
    console.error(`Not a version tag: "${tag}". Usage: node scripts/check-release.mjs v0.3.0`);
    process.exit(1);
}

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const server = JSON.parse(read("server.json"));
const changelog = read("CHANGELOG.md");

const problems = [];

for (const [where, found] of [
    ["package.json version", pkg.version],
    ["server.json version", server.version],
    ["server.json packages[0].version", server.packages?.[0]?.version]
]) {
    if (found !== version) {
        problems.push(`${where} is ${found}, expected ${version}`);
    }
}

const heading = changelog.split(/\r?\n/).find((line) => line.startsWith(`## [${version}]`));

if (!heading) {
    problems.push(`CHANGELOG.md has no "## [${version}]" section`);
} else if (/unreleased/i.test(heading)) {
    problems.push(`CHANGELOG.md heading still says Unreleased ("${heading}"); set the release date`);
}

if (problems.length > 0) {
    console.error(`${tag} is not ready to release:\n- ${problems.join("\n- ")}`);
    process.exit(1);
}

console.log(`${tag} is ready: package.json, server.json, and CHANGELOG.md all match ${version}.`);
