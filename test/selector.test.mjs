import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectorLabel, selectorToBy, timeoutMsSchema } from "../dist/tools/shared/selector.js";

describe("selector helpers", () => {
  it("formats selector labels for structured messages", () => {
    assert.equal(selectorLabel({ by: "css", value: "#login" }), "css=#login");
  });

  it("supports common Selenium locator aliases", () => {
    assert.equal(selectorToBy({ by: "tag", value: "button" }).value, "button");
    assert.equal(selectorToBy({ by: "class", value: "primary" }).value, ".primary");
  });

  it("applies the default timeout", () => {
    assert.equal(timeoutMsSchema.parse(undefined), 10000);
  });
});
