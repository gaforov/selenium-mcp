import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { SUPPORTED_BROWSERS, driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const windowSizeSchema = z
    .object({
        width: z.number().int().min(320).max(7680).describe("Window width in pixels (320-7680)."),
        height: z.number().int().min(240).max(4320).describe("Window height in pixels (240-4320).")
    })
    .optional()
    .describe(
        "Initial window size, e.g. { width: 1440, height: 900 }. Change it later with the window tool's resize action."
    );

export function registerStartBrowserTool(server: McpServer): void {
    server.registerTool(
        "start_browser",
        {
            description:
                "Start a browser session (Chrome, Firefox, or Edge) that all other tools act on. Call this first. " +
                "Only one session can be started this way: call stop_browser before starting another, or use session_create to run several browsers at once. " +
                "The matching driver is downloaded automatically by Selenium Manager. Returns the session status.",
            inputSchema: {
                browser: z
                    .enum(SUPPORTED_BROWSERS)
                    .default("chrome")
                    .describe("Which browser to launch: chrome (default), firefox, or edge. It must be installed on this machine."),
                headless: z
                    .boolean()
                    .default(false)
                    .describe(
                        "Run without a visible window (default false). Use true for CI or background runs, false when the user wants to watch."
                    ),
                browserArgs: z
                    .array(z.string().min(1))
                    .default([])
                    .describe("Extra command-line flags for the browser, e.g. ['--incognito'] or ['--lang=de']. Default none."),
                pageLoadTimeoutMs: z
                    .number()
                    .int()
                    .min(1000)
                    .max(300000)
                    .default(30000)
                    .describe("Maximum time a page load may take before navigate fails, in milliseconds (default 30000)."),
                scriptTimeoutMs: z
                    .number()
                    .int()
                    .min(1000)
                    .max(300000)
                    .default(30000)
                    .describe("Maximum time an asynchronous script may run, in milliseconds (default 30000)."),
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
