import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerGetTitleTool(server: McpServer): void {
    server.registerTool(
        "get_title",
        {
            description: "Return the current page title."
        },
        async () => {
            try {
                const driver = driverManager.getOrThrow();
                const title = await driver.getTitle();

                return textResult(`Page title: ${title}`, {
                    title
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
