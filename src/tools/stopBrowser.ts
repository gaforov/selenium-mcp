import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerStopBrowserTool(server: McpServer): void {
    server.registerTool(
        "stop_browser",
        {
            description:
                "Close the active browser session and quit its browser; its cookies, login state, and open pages are lost. " +
                "With several sessions open, only the active one closes and another becomes active; use session_destroy to close a specific one. " +
                "Safe to call when nothing is running. Call it when you are done, so no browser is left open."
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
