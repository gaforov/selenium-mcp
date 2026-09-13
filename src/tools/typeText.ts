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
            description:
                "Type text into an input, textarea, or other editable element. Waits for it to be visible, clears the current value first " +
                "(clearFirst: false appends instead), then sends the text as keystrokes so the page's input events fire; submit: true presses Enter afterwards. " +
                "Target it by selector or by a ref from capture_page. For dropdowns use select_option; for single keys like Tab or Escape use press_key.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector,
                ref: selectorOrRefInputSchema.shape.ref,
                text: z.string().describe("The text to type, e.g. 'standard_user'."),
                clearFirst: z
                    .boolean()
                    .default(true)
                    .describe("Clear the field before typing (default true). Set false to append to the existing value."),
                submit: z
                    .boolean()
                    .default(false)
                    .describe("Press Enter after typing (default false), e.g. to submit a search box or login form."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the field to become visible, in milliseconds (default 10000)."
                )
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
