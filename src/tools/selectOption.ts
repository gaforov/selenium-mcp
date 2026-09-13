import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { selectOption } from "./shared/selectOption.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForVisibleElement } from "./shared/waits.js";

export function registerSelectOptionTool(server: McpServer): void {
    server.registerTool(
        "select_option",
        {
            description:
                "Select an option in a native <select> dropdown by visible text, value, or zero-based index, and return the resulting selection. " +
                "Waits for the dropdown to be visible, then clicks the option like a user so change events fire; on a multi-select it adds to the current selection. " +
                "If nothing matches, the error lists the available options so you can retry. " +
                "Only for real <select> elements; for custom dropdowns built from other elements, click the trigger and then the option.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector.describe(
                    "Locator for the <select> element, e.g. { by: 'id', value: 'country' }. Provide either selector or ref."
                ),
                ref: selectorOrRefInputSchema.shape.ref.describe(
                    "Element ref from capture_page (e.g. 'e12') pointing at the <select>. Use instead of selector."
                ),
                text: z
                    .string()
                    .optional()
                    .describe(
                        "Visible text of the option to select, matched exactly after trimming (e.g. 'Canada'). Provide exactly one of text, value, or index."
                    ),
                value: z
                    .string()
                    .optional()
                    .describe("The option's value attribute (e.g. 'ca'). Provide exactly one of text, value, or index."),
                index: z
                    .number()
                    .int()
                    .min(0)
                    .optional()
                    .describe(
                        "Zero-based position of the option, counting every <option> including placeholders like 'Choose...'. Provide exactly one of text, value, or index."
                    ),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the dropdown to become visible, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, ref, text, value, index, timeoutMs }) => {
            let label = "unknown";
            let resolvedSelector = selector;

            try {
                const target = await resolveSelectorFromTarget({ selector, ref });
                resolvedSelector = target.selector;
                label = target.label;

                const driver = driverManager.getOrThrow();
                const element = await waitForVisibleElement(driver, resolvedSelector, timeoutMs);
                const { multiple, selected } = await selectOption(driver, element, { text, value, index });
                const summary = selected.map((option) => `"${option.text}"`).join(", ") || "nothing";

                return textResult(`Selected ${summary} in ${label}.`, {
                    selector: resolvedSelector,
                    ref,
                    multiple,
                    selected
                });
            } catch (err) {
                return errorResult(`Failed to select option in ${label}: ${toErrorMessage(err)}`, {
                    selector: resolvedSelector,
                    ref,
                    text,
                    value,
                    index
                });
            }
        }
    );
}
