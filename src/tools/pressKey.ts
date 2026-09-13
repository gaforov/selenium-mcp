import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Key } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const namedKeys: Record<string, string> = {
    enter: Key.ENTER,
    tab: Key.TAB,
    escape: Key.ESCAPE,
    esc: Key.ESCAPE,
    backspace: Key.BACK_SPACE,
    delete: Key.DELETE,
    space: Key.SPACE,
    arrowup: Key.ARROW_UP,
    arrowdown: Key.ARROW_DOWN,
    arrowleft: Key.ARROW_LEFT,
    arrowright: Key.ARROW_RIGHT,
    home: Key.HOME,
    end: Key.END,
    pageup: Key.PAGE_UP,
    pagedown: Key.PAGE_DOWN
};

function normalizeKey(key: string): string {
    return namedKeys[key.toLowerCase()] ?? key;
}

export function registerPressKeyTool(server: McpServer): void {
    server.registerTool(
        "press_key",
        {
            description:
                "Press one key on whichever element currently has focus, e.g. Enter to submit, Tab to move focus, Escape to close a dialog, or arrow keys in a list. " +
                "Named keys: enter, tab, escape/esc, backspace, delete, space, arrowup, arrowdown, arrowleft, arrowright, home, end, pageup, pagedown; " +
                "any other value is typed as literal text. To type into a specific field, use type, which focuses the field first.",
            inputSchema: {
                key: z
                    .string()
                    .min(1)
                    .describe("Key name (case-insensitive), e.g. 'Enter', 'Tab', 'Escape', 'ArrowDown', or a single character.")
            }
        },
        async ({ key }) => {
            try {
                const driver = driverManager.getOrThrow();
                const element = await driver.switchTo().activeElement();

                await element.sendKeys(normalizeKey(key));

                return textResult(`Pressed key: ${key}.`, {
                    key
                });
            } catch (err) {
                return errorResult(`Failed to press key ${key}: ${toErrorMessage(err)}`, {
                    key
                });
            }
        }
    );
}
