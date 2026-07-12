import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
    deleteSelectorHint,
    getSelectorHint,
    listSelectorHints,
    saveSelectorHint
} from "../dist/tools/shared/selectorHints.js";

describe("selector hint persistence", () => {
    it("saves, resolves, lists, and deletes hints", async () => {
        const dir = await mkdtemp(join(tmpdir(), "selenium-mcp-hints-"));
        process.env.SELENIUM_MCP_SELECTOR_HINTS_PATH = join(dir, "selector-hints.json");

        try {
            const created = await saveSelectorHint("example.com", "login_button", {
                by: "css",
                value: "button[type='submit']"
            });

            assert.equal(created.domain, "example.com");
            assert.equal(created.key, "login_button");

            const resolved = await getSelectorHint("example.com", "login_button");
            assert.equal(resolved?.selector.by, "css");
            assert.equal(resolved?.selector.value, "button[type='submit']");
            assert.equal(resolved?.hits, 1);

            const list = await listSelectorHints("example.com");
            assert.equal(list.length, 1);

            const deleted = await deleteSelectorHint("example.com", "login_button");
            assert.equal(deleted, true);

            const empty = await listSelectorHints("example.com");
            assert.equal(empty.length, 0);
        } finally {
            delete process.env.SELENIUM_MCP_SELECTOR_HINTS_PATH;
            await rm(dir, { recursive: true, force: true });
        }
    });
});
