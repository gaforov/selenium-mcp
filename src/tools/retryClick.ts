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
            description: "Retry a click for transient UI failures such as stale or intercepted elements.",
            inputSchema: {
                selector: selectorSchema,
                timeoutMs: timeoutMsSchema,
                attempts: z.number().int().min(1).max(10).default(3),
                delayMs: z.number().int().min(0).max(10000).default(250)
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
