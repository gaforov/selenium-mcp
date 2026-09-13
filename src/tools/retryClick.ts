import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForClickableElement } from "./shared/waits.js";

export function registerRetryClickTool(server: McpServer): void {
    server.registerTool(
        "retry_click",
        {
            description:
                "Click with retries, for clicks that fail intermittently: the element is covered by a loading overlay or animation, " +
                "or re-rendered (stale) between being found and clicked. Each attempt waits for the element to be visible and enabled, then clicks; " +
                "failed attempts pause delayMs before the next. Returns the attempt that succeeded, or every attempt's error. " +
                "Try click first; use this when click failed because of timing.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema.describe(
                    "How long each attempt waits for the element to become visible and enabled, in milliseconds (default 10000)."
                ),
                attempts: z.number().int().min(1).max(10).default(3).describe("Maximum click attempts, 1-10 (default 3)."),
                delayMs: z
                    .number()
                    .int()
                    .min(0)
                    .max(10000)
                    .default(250)
                    .describe("Pause between failed attempts, in milliseconds (default 250).")
            }
        },
        async ({ selector, timeoutMs, attempts, delayMs }) => {
            const label = selectorLabel(selector);
            const errors: string[] = [];

            try {
                const driver = driverManager.getOrThrow();

                for (let attempt = 1; attempt <= attempts; attempt += 1) {
                    try {
                        const element = await waitForClickableElement(driver, selector, timeoutMs);
                        await element.click();

                        return textResult(`Clicked element ${label} on attempt ${attempt}.`, {
                            selector,
                            timeoutMs,
                            attempts,
                            delayMs,
                            attempt
                        });
                    } catch (err) {
                        errors.push(toErrorMessage(err));

                        if (attempt < attempts && delayMs > 0) {
                            await driver.sleep(delayMs);
                        }
                    }
                }

                return errorResult(`Failed to click element ${label} after ${attempts} attempts.`, {
                    selector,
                    timeoutMs,
                    attempts,
                    delayMs,
                    errors
                });
            } catch (err) {
                return errorResult(`Failed to retry click element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    attempts,
                    delayMs,
                    errors
                });
            }
        }
    );
}
