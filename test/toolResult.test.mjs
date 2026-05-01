import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { errorResult, textResult, toErrorMessage } from "../dist/utils/toolResult.js";

describe("tool result helpers", () => {
  it("returns MCP text content with structured content", () => {
    assert.deepEqual(textResult("ok", { value: 1 }), {
      content: [{ type: "text", text: "ok" }],
      structuredContent: { value: 1 }
    });
  });

  it("marks error responses", () => {
    assert.deepEqual(errorResult("bad"), {
      isError: true,
      content: [{ type: "text", text: "bad" }]
    });
  });

  it("normalizes unknown errors", () => {
    assert.equal(toErrorMessage(new Error("boom")), "boom");
    assert.equal(toErrorMessage("nope"), "Unknown error");
  });
});
