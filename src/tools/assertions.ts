import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForLocatedElement, waitForVisibleElement } from "./shared/waits.js";

const matchModeSchema = z.enum(["equals", "contains", "matches"]);

function matchesValue(actual: string, expected: string, mode: z.infer<typeof matchModeSchema>): boolean {
    if (mode === "equals") {
        return actual === expected;
    }

    if (mode === "contains") {
        return actual.includes(expected);
    }

    return new RegExp(expected).test(actual);
}

export function registerAssertionTools(server: McpServer): void {
    server.registerTool(
        "assert_text",
        {
            description:
                "Test step: check that an element's visible text equals, contains (default), or matches a regular expression. " +
                "Waits for the element to be visible, then checks once (it does not wait for the text to change). " +
                "Passes with the actual text, or fails as a tool error showing expected vs actual, so it works as an acceptance check. " +
                "Use get_text to just read text without a pass/fail.",
            inputSchema: {
                selector: selectorSchema,
                expected: z
                    .string()
                    .describe("Text or pattern the element's text should match, e.g. 'Epic sadface: Username is required'."),
                mode: matchModeSchema
                    .default("contains")
                    .describe("equals = exact match; contains = substring (default); matches = JavaScript regular expression."),
                trim: z
                    .boolean()
                    .default(true)
                    .describe("Trim whitespace from the actual text before comparing (default true)."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to become visible, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, expected, mode, trim, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, selector, timeoutMs);
                const rawText = await element.getText();
                const actual = trim ? rawText.trim() : rawText;
                const passed = matchesValue(actual, expected, mode);

                if (!passed) {
                    return errorResult(`Text assertion failed for ${label}.`, {
                        selector,
                        timeoutMs,
                        expected,
                        actual,
                        mode,
                        trim
                    });
                }

                return textResult(`Text assertion passed for ${label}.`, {
                    selector,
                    timeoutMs,
                    expected,
                    actual,
                    mode,
                    trim
                });
            } catch (err) {
                return errorResult(`Text assertion failed for ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    expected,
                    mode,
                    trim
                });
            }
        }
    );

    server.registerTool(
        "assert_visible",
        {
            description:
                "Test step: check that an element becomes visible within timeoutMs, e.g. a success banner or a cart badge. " +
                "Passes as soon as it is displayed; fails as a tool error if it is missing or stays hidden. " +
                "Similar to wait_for_element with visible: true, but phrased as a pass/fail assertion.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to become visible before failing, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                await waitForVisibleElement(driver, selector, timeoutMs);

                return textResult(`Visibility assertion passed for ${label}.`, {
                    selector,
                    timeoutMs,
                    visible: true
                });
            } catch (err) {
                return errorResult(`Visibility assertion failed for ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    visible: false
                });
            }
        }
    );

    server.registerTool(
        "assert_attribute",
        {
            description:
                "Test step: check that an element's attribute or property equals (default), contains, or matches a regular expression, " +
                "e.g. that a button is disabled or an input's value is 'standard_user'. " +
                "Waits for the element to exist; a missing attribute counts as an empty string. Fails as a tool error showing expected vs actual.",
            inputSchema: {
                selector: selectorSchema,
                name: z
                    .string()
                    .min(1)
                    .describe("Attribute or property to check, e.g. 'value', 'disabled', 'href', or 'class'."),
                expected: z.string().describe("Expected value or pattern, e.g. 'true' for a disabled button."),
                mode: matchModeSchema
                    .default("equals")
                    .describe("equals = exact match (default); contains = substring; matches = JavaScript regular expression."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the element to exist, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, name, expected, mode, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForLocatedElement(driver, selector, timeoutMs);
                const actual = (await element.getAttribute(name)) ?? "";
                const passed = matchesValue(actual, expected, mode);

                if (!passed) {
                    return errorResult(`Attribute assertion failed for ${label}.`, {
                        selector,
                        timeoutMs,
                        name,
                        expected,
                        actual,
                        mode
                    });
                }

                return textResult(`Attribute assertion passed for ${label}.`, {
                    selector,
                    timeoutMs,
                    name,
                    expected,
                    actual,
                    mode
                });
            } catch (err) {
                return errorResult(`Attribute assertion failed for ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    name,
                    expected,
                    mode
                });
            }
        }
    );
}
