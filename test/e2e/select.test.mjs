import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useBrowserSession } from "./helpers/harness.mjs";

const byId = (value) => ({ by: "id", value });
const country = byId("country");
const toppings = byId("toppings");

describe("select_option (e2e)", { timeout: 120_000 }, () => {
    const session = useBrowserSession();
    const open = () => session.mcp.ok("navigate", { url: session.fixtures.url("select.html") });

    it("selects by visible text and fires the change event", async () => {
        await open();

        const result = await session.mcp.ok("select_option", { selector: country, text: "Canada" });
        assert.deepEqual(result.data.selected, [{ index: 2, text: "Canada", value: "ca" }]);
        assert.equal(result.data.multiple, false);

        // The page's own change listener ran, so this was a real user-style selection.
        await session.mcp.ok("assert_text", { selector: byId("country-output"), expected: "Selected: ca", mode: "equals" });
    });

    it("selects by value", async () => {
        await open();

        await session.mcp.ok("select_option", { selector: country, value: "us" });
        await session.mcp.ok("assert_attribute", { selector: country, name: "value", expected: "us" });
    });

    it("selects by zero-based index", async () => {
        await open();

        const result = await session.mcp.ok("select_option", { selector: country, index: 2 });
        assert.equal(result.data.selected[0].text, "Canada");
    });

    it("adds to the selection on a multi-select without toggling existing picks off", async () => {
        await open();

        await session.mcp.ok("select_option", { selector: toppings, text: "Cheese" });
        await session.mcp.ok("select_option", { selector: toppings, value: "olives" });
        const again = await session.mcp.ok("select_option", { selector: toppings, text: "Cheese" });

        assert.equal(again.data.multiple, true);
        assert.deepEqual(
            again.data.selected.map((option) => option.value),
            ["cheese", "olives"]
        );
    });

    it("works with a capture_page ref", async () => {
        await open();

        const snapshot = await session.mcp.ok("capture_page");
        const countryRef = snapshot.data.nodes.find((node) => node.id === "country")?.ref;
        assert.ok(countryRef, "snapshot should include a ref for #country");

        const result = await session.mcp.ok("select_option", { ref: countryRef, text: "United States" });
        assert.equal(result.data.selected[0].value, "us");
    });

    it("explains what went wrong so the agent can recover", async () => {
        await open();

        const noMatch = await session.mcp.call("select_option", { selector: country, text: "Atlantis" });
        assert.equal(noMatch.isError, true);
        assert.match(noMatch.text, /No option matches text "Atlantis"/);
        assert.match(noMatch.text, /Available options: .*"Canada" \(value "ca"\)/);

        const disabled = await session.mcp.call("select_option", { selector: country, text: "Mexico" });
        assert.equal(disabled.isError, true);
        assert.match(disabled.text, /is disabled/);

        const ambiguous = await session.mcp.call("select_option", { selector: country, text: "Canada", value: "ca" });
        assert.equal(ambiguous.isError, true);
        assert.match(ambiguous.text, /exactly one of text, value, or index/);

        const notASelect = await session.mcp.call("select_option", { selector: { by: "css", value: "h1" }, text: "x" });
        assert.equal(notASelect.isError, true);
        assert.match(notASelect.text, /not a <select> dropdown \(found <h1>\)/);

        // None of the failures changed the dropdown.
        await session.mcp.ok("assert_attribute", { selector: country, name: "value", expected: "" });
    });

    it("is available as a batch_execute step", async () => {
        await open();

        const batch = await session.mcp.ok("batch_execute", {
            steps: [
                { action: "select_option", selector: country, value: "ca" },
                { action: "execute_script", script: "return document.getElementById('country-output').textContent;" }
            ]
        });

        assert.equal(batch.data.results[0].details.selected[0].text, "Canada");
        assert.equal(batch.data.results[1].details.result, "Selected: ca");
    });
});
