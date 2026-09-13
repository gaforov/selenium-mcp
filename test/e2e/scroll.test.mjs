import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useBrowserSession } from "./helpers/harness.mjs";

const byId = (value) => ({ by: "id", value });

describe("scroll (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = () => session.mcp.ok("navigate", { url: session.fixtures.url("scroll.html") });

    // Independent check of page state, so tests don't only trust what scroll reports about itself.
    const pageJs = async (script) => {
        const batch = await session.mcp.ok("batch_execute", { steps: [{ action: "execute_script", script }] });
        return batch.data.results[0].details.result;
    };

    it("scrolls by pixels and back to the top", async () => {
        await open();

        const down = await session.mcp.ok("scroll", { deltaY: 500 });
        assert.equal(down.data.scrollTop, 500);
        assert.equal(down.data.container, "page");
        assert.equal(await pageJs("return Math.round(window.scrollY);"), 500);

        const top = await session.mcp.ok("scroll", { to: "top" });
        assert.equal(top.data.scrollTop, 0);
        assert.equal(top.data.atTop, true);
        assert.equal(await pageJs("return window.scrollY;"), 0);
    });

    it("scrolls an element into view", async () => {
        await open();
        const isOnScreen =
            "const r = document.getElementById('far-button').getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight;";
        assert.equal(await pageJs(isOnScreen), false);

        const result = await session.mcp.ok("scroll", { selector: byId("far-button") });
        assert.equal(result.data.inViewport, true);
        assert.equal(await pageJs(isOnScreen), true);
    });

    it("scrolls inside a container without moving the page", async () => {
        await open();

        const result = await session.mcp.ok("scroll", { selector: byId("chat"), to: "bottom" });
        assert.equal(result.data.container, "element");
        assert.equal(result.data.atBottom, true);
        assert.equal(await pageJs("return document.getElementById('chat').scrollTop > 0 && window.scrollY === 0;"), true);
    });

    it("loads an infinite-scroll feed until atBottom stays true", async () => {
        await open();

        // The loop an agent would run: scroll to the bottom, wait for new items, repeat.
        for (const nextItem of ["item-6", "item-11", "item-16"]) {
            await session.mcp.ok("scroll", { to: "bottom" });
            await session.mcp.ok("wait_for_element", { selector: byId(nextItem), timeoutMs: 5000 });
        }
        await session.mcp.ok("assert_text", { selector: byId("feed-status"), expected: "All items loaded", mode: "equals" });

        const last = await session.mcp.ok("scroll", { to: "bottom" });
        assert.equal(last.data.atBottom, true);
        assert.match(last.text, /Reached the bottom/);

        const more = await session.mcp.call("wait_for_element", { selector: byId("item-21"), timeoutMs: 500 });
        assert.equal(more.isError, true);
    });

    it("rejects empty or ambiguous requests with guidance", async () => {
        await open();

        const empty = await session.mcp.call("scroll", {});
        assert.equal(empty.isError, true);
        assert.match(empty.text, /Provide an element \(selector or ref\)/);

        const both = await session.mcp.call("scroll", { to: "bottom", deltaY: 100 });
        assert.equal(both.isError, true);
        assert.match(both.text, /either to or deltaX\/deltaY/);
    });
});
