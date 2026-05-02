import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAlertTool } from "./alert.js";
import { registerAssertionTools } from "./assertions.js";
import { registerClickTool } from "./click.js";
import { registerCookieTools } from "./cookies.js";
import { registerExecuteScriptTool } from "./executeScript.js";
import { registerFrameTool } from "./frame.js";
import { registerGetAttributeTool } from "./getAttribute.js";
import { registerGetCurrentUrlTool } from "./getCurrentUrl.js";
import { registerGetPageSourceTool } from "./getPageSource.js";
import { registerGetTextTool } from "./getText.js";
import { registerGetTitleTool } from "./getTitle.js";
import { registerInteractTool } from "./interact.js";
import { registerNavigateTool } from "./navigate.js";
import { registerOpenUrlTool } from "./openUrl.js";
import { registerPressKeyTool } from "./pressKey.js";
import { registerRetryClickTool } from "./retryClick.js";
import { registerStartBrowserTool } from "./startBrowser.js";
import { registerStopBrowserTool } from "./stopBrowser.js";
import { registerTakeScreenshotTool } from "./takeScreenshot.js";
import { registerTypeTool } from "./typeText.js";
import { registerUploadFileTool } from "./uploadFile.js";
import { registerWaitForElementTool } from "./waitForElement.js";
import { registerWindowTool } from "./window.js";

export function registerCoreTools(server: McpServer): void {
    registerStartBrowserTool(server);
    registerOpenUrlTool(server);
    registerNavigateTool(server);
    registerClickTool(server);
    registerInteractTool(server);
    registerTypeTool(server);
    registerGetTextTool(server);
    registerGetAttributeTool(server);
    registerAssertionTools(server);
    registerWaitForElementTool(server);
    registerRetryClickTool(server);
    registerPressKeyTool(server);
    registerTakeScreenshotTool(server);
    registerGetCurrentUrlTool(server);
    registerGetTitleTool(server);
    registerGetPageSourceTool(server);
    registerExecuteScriptTool(server);
    registerUploadFileTool(server);
    registerWindowTool(server);
    registerFrameTool(server);
    registerAlertTool(server);
    registerCookieTools(server);
    registerStopBrowserTool(server);
}

// Exported list of core tool names for CLI listing and external inspection.
export const CORE_TOOL_NAMES = [
    "start_browser",
    "open_url",
    "navigate",
    "click",
    "interact",
    "type",
    "get_text",
    "get_attribute",
    "assert_text",
    "assert_visible",
    "assert_attribute",
    "wait_for_element",
    "retry_click",
    "press_key",
    "take_screenshot",
    "get_current_url",
    "get_title",
    "get_page_source",
    "execute_script",
    "upload_file",
    "window",
    "frame",
    "alert",
    "add_cookie",
    "get_cookies",
    "delete_cookie",
    "stop_browser"
];
