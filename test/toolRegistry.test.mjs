import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CORE_TOOL_NAMES } from "../dist/tools/index.js";

describe("tool registry metadata", () => {
    it("includes new batch and session tools", () => {
        assert.ok(CORE_TOOL_NAMES.includes("batch_execute"));
        assert.ok(CORE_TOOL_NAMES.includes("session_create"));
        assert.ok(CORE_TOOL_NAMES.includes("session_select"));
        assert.ok(CORE_TOOL_NAMES.includes("session_list"));
        assert.ok(CORE_TOOL_NAMES.includes("session_destroy"));
    });

    it("includes wait and discovery aliases", () => {
        assert.ok(CORE_TOOL_NAMES.includes("find_element"));
        assert.ok(CORE_TOOL_NAMES.includes("wait_until_visible"));
    });

    it("does not contain duplicate tool names", () => {
        const unique = new Set(CORE_TOOL_NAMES);
        assert.equal(unique.size, CORE_TOOL_NAMES.length);
    });
});
