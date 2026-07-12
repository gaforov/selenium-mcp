import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForVisibleElement } from "./shared/waits.js";

export function registerGetTextTool(server: McpServer): void {
    server.registerTool(
        "get_text",
        {
            description: "Read visible text from an element.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                timeoutMs: timeoutMsSchema,
                trim: z.boolean().default(true)
            }
        },
        async ({ selector, ref, timeoutMs, trim }) => {
            let label = "unknown";
            let resolvedSelector = selector;

            try {
                const target = await resolveSelectorFromTarget({ selector, ref });
                resolvedSelector = target.selector;
                label = target.label;

                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, resolvedSelector, timeoutMs);
                const rawText = await element.getText();
                const text = trim ? rawText.trim() : rawText;

                return textResult(`Read text from element ${label}.`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs,
                    trim,
                    text
                });
            } catch (err) {
                return errorResult(`Failed to read text from element ${label}: ${toErrorMessage(err)}`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs,
                    trim
                });
            }
        }
    );
}
