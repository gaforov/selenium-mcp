import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetCurrentUrlTool(server: McpServer): void {
    server.registerTool(
        "get_current_url",
        {
            description:
                "Return the URL of the current tab, including any query string and fragment. " +
                "Use it to confirm where a click or redirect landed; to wait until the URL changes, use wait_for_page."
        },
        async () => {
            try {
                const driver = driverManager.getOrThrow();
                const currentUrl = await driver.getCurrentUrl();

                return textResult(`Current URL: ${currentUrl}`, {
                    currentUrl
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
