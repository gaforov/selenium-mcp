import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerClickTool } from "./click.js";
import { registerGetTextTool } from "./getText.js";
import { registerOpenUrlTool } from "./openUrl.js";
import { registerStartBrowserTool } from "./startBrowser.js";
import { registerStopBrowserTool } from "./stopBrowser.js";
import { registerTypeTool } from "./typeText.js";

export function registerCoreTools(server: McpServer): void {
    registerStartBrowserTool(server);
    registerOpenUrlTool(server);
    registerClickTool(server);
    registerTypeTool(server);
    registerGetTextTool(server);
    registerStopBrowserTool(server);
}
