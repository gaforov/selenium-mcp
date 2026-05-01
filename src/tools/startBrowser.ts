import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { SUPPORTED_BROWSERS, driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const windowSizeSchema = z
    .object({
        width: z.number().int().min(320).max(7680),
        height: z.number().int().min(240).max(4320)
    })
    .optional();

export function registerStartBrowserTool(server: McpServer): void {
    server.registerTool(
        "start_browser",
        {
            description: "Start a Selenium browser session.",
            inputSchema: {
                browser: z.enum(SUPPORTED_BROWSERS).default("chrome"),
                headless: z.boolean().default(false),
                browserArgs: z.array(z.string().min(1)).default([]),
                pageLoadTimeoutMs: z.number().int().min(1000).max(300000).default(30000),
                scriptTimeoutMs: z.number().int().min(1000).max(300000).default(30000),
                windowSize: windowSizeSchema
            }
        },
        async ({ browser, headless, browserArgs, pageLoadTimeoutMs, scriptTimeoutMs, windowSize }) => {
            try {
                const status = await driverManager.start({
                    browser,
                    headless,
                    browserArgs,
                    pageLoadTimeoutMs,
                    scriptTimeoutMs,
                    windowSize: windowSize ?? null
                });

                return textResult(`Browser started: ${browser} (headless=${headless}).`, {
                    status
                });
            } catch (err) {
                return errorResult(toErrorMessage(err));
            }
        }
    );
}
