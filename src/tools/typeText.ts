import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Key } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorLabel, selectorSchema, timeoutMsSchema } from "./shared/selector.js";
import { waitForVisibleElement } from "./shared/waits.js";

export function registerTypeTool(server: McpServer): void {
    server.registerTool(
        "type",
        {
            description: "Type text into an element after waiting for visibility.",
            inputSchema: {
                selector: selectorSchema,
                text: z.string(),
                clearFirst: z.boolean().default(true),
                submit: z.boolean().default(false),
                timeoutMs: timeoutMsSchema
            }
        },
        async ({ selector, text, clearFirst, submit, timeoutMs }) => {
            const label = selectorLabel(selector);

            try {
                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, selector, timeoutMs);

                if (clearFirst) {
                    await element.clear();
                }

                await element.sendKeys(text);

                if (submit) {
                    await element.sendKeys(Key.ENTER);
                }

                return textResult(`Typed text into element ${label}.`, {
                    selector,
                    timeoutMs,
                    clearFirst,
                    submit,
                    typedLength: text.length
                });
            } catch (err) {
                return errorResult(`Failed to type into element ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    timeoutMs,
                    clearFirst,
                    submit
                });
            }
        }
    );
}
