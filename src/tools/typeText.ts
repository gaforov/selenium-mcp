import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Key } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForVisibleElement } from "./shared/waits.js";

export function registerTypeTool(server: McpServer): void {
    server.registerTool(
        "type",
        {
            description: "Type text into an element after waiting for visibility.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                text: z.string(),
                clearFirst: z.boolean().default(true),
                submit: z.boolean().default(false),
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, ref, text, clearFirst, submit, timeoutMs }) => {
            let label = "unknown";
            let resolvedSelector = selector;

            try {
                const target = await resolveSelectorFromTarget({ selector, ref });
                resolvedSelector = target.selector;
                label = target.label;

                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, resolvedSelector, timeoutMs);

                if (clearFirst) {
                    await element.clear();
                }

                await element.sendKeys(text);

                if (submit) {
                    await element.sendKeys(Key.ENTER);
                }

                return textResult(`Typed text into element ${label}.`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs,
                    clearFirst,
                    submit,
                    typedLength: text.length
                });
            } catch (err) {
                return errorResult(`Failed to type into element ${label}: ${toErrorMessage(err)}`, {
                    selector: resolvedSelector,
                    ref,
                    timeoutMs,
                    clearFirst,
                    submit
                });
            }
        }
    );
}
