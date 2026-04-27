import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerStopBrowserTool(server: McpServer): void {
    server.registerTool(
        "stop_browser",
        {
            description: "Stop the active Selenium browser session if one exists."
        },
        async () => {
            try {
                const status = await driverManager.stop();

                return textResult("Browser stopped.", {
                    status
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
