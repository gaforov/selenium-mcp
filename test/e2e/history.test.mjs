import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useBrowserSession } from "./helpers/harness.mjs";

const byId = (value) => ({ by: "id", value });

describe("history (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = (page) => session.mcp.ok("navigate", { url: session.fixtures.url(page) });

    const loadCount = async () => {
        const result = await session.mcp.ok("get_text", { selector: byId("loads") });
        return Number(result.data.text.replace("Loads: ", ""));
    };

    it("goes back and forward through the tab's history", async () => {
        await open("history.html");
        await session.mcp.ok("click", { selector: byId("to-form") });
        await session.mcp.ok("wait_for_element", { selector: byId("name"), visible: true });

        const back = await session.mcp.ok("history", { action: "back" });
        assert.match(back.data.currentUrl, /\/history\.html$/);
        assert.equal(back.data.title, "Fixture: History");
        assert.equal(back.data.urlChanged, true);

        const forward = await session.mcp.ok("history", { action: "forward" });
        assert.match(forward.data.currentUrl, /\/form\.html$/);
        assert.equal(forward.data.title, "Fixture: Form");
        assert.equal(forward.data.urlChanged, true);
    });

    it("refresh actually reloads the page", async () => {
        await open("history.html");
        const before = await loadCount();

        const reloaded = await session.mcp.ok("history", { action: "refresh" });
        assert.equal(reloaded.data.urlChanged, false);
        assert.match(reloaded.text, /^Reloaded /);
        assert.equal(await loadCount(), before + 1);
    });

    it("says so when there is nowhere further to go", async () => {
        // A fresh navigation clears forward history, so "forward" has nowhere to go.
        await open("history.html");

        const forward = await session.mcp.ok("history", { action: "forward" });
        assert.equal(forward.data.urlChanged, false);
        assert.match(forward.text, /no later page in this tab's history/);
    });
});
