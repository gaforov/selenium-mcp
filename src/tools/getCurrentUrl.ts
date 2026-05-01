import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetCurrentUrlTool(server: McpServer): void {
    server.registerTool(
        "get_current_url",
        {
            description: "Return the current browser URL."
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
