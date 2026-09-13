import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerAlertTool(server: McpServer): void {
    server.registerTool(
        "alert",
        {
            description:
                "Handle a native browser dialog opened by alert(), confirm(), or prompt(). While one is open, other page actions fail until it is handled. " +
                "get_text reads the message; accept clicks OK and dismiss clicks Cancel, which close the dialog and let the page act on the answer (this cannot be undone); " +
                "send_text types into a prompt() before you accept it. Every action returns the dialog's text. Fails if no dialog is open. " +
                "Custom in-page modals are not native dialogs: use click on their buttons instead.",
            inputSchema: {
                action: z
                    .enum(["get_text", "accept", "dismiss", "send_text"])
                    .describe("get_text = read the message; accept = OK; dismiss = Cancel; send_text = type into a prompt() (then accept)."),
                text: z
                    .string()
                    .optional()
                    .describe("For send_text: the text to type into the prompt() field. Ignored for other actions.")
            }
        },
        async ({ action, text }) => {
            try {
                const driver = driverManager.getOrThrow();
                const alert = await driver.switchTo().alert();
                const alertText = await alert.getText();

                if (action === "get_text") {
                    return textResult("Read alert text.", {
                        action,
                        text: alertText
                    });
                }

                if (action === "send_text") {
                    if (text === undefined) {
                        return errorResult("Text is required when action is send_text.", {
                            action
                        });
                    }

                    await alert.sendKeys(text);

                    return textResult("Sent text to alert.", {
                        action,
                        previousText: alertText,
                        sentLength: text.length
                    });
                }

                if (action === "accept") {
                    await alert.accept();

                    return textResult("Accepted alert.", {
                        action,
                        text: alertText
                    });
                }

                await alert.dismiss();

                return textResult("Dismissed alert.", {
                    action,
                    text: alertText
                });
            } catch (err) {
                return errorResult(`Alert action failed: ${toErrorMessage(err)}`, {
                    action
                });
            }
        }
    );
}
