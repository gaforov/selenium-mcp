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
            description: "Assert visible element text equals, contains, or matches a regular expression.",
            inputSchema: {
                selector: selectorSchema,
                expected: z.string(),
                mode: matchModeSchema.default("contains"),
                trim: z.boolean().default(true),
                timeoutMs: timeoutMsSchema
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
            description: "Assert an element becomes visible.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema
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
            description: "Assert an element attribute/property equals, contains, or matches a regular expression.",
            inputSchema: {
                selector: selectorSchema,
                name: z.string().min(1),
                expected: z.string(),
                mode: matchModeSchema.default("equals"),
                timeoutMs: timeoutMsSchema
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
