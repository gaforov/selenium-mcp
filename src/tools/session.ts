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
    .describe("Initial window size, e.g. { width: 1440, height: 900 }. Change it later with the window tool's resize action.");

const sessionIdSchema = z
    .string()
    .min(1)
    .describe("Session id, as returned by session_create or session_list.");

export function registerSessionTools(server: McpServer): void {
    server.registerTool(
        "session_create",
        {
            description:
                "Open an additional, independent browser session (its own window, cookies, and login state) and make it the active one; all other tools act on the active session. " +
                "Use it to test several users at once, such as a buyer and a seller, or to compare two states side by side. Switch between sessions with session_select. " +
                "Takes the same options as start_browser. Returns the new session and overall status.",
            inputSchema: {
                browser: z
                    .enum(SUPPORTED_BROWSERS)
                    .default("chrome")
                    .describe("Which browser to launch: chrome (default), firefox, or edge. It must be installed on this machine."),
                headless: z
                    .boolean()
                    .default(false)
                    .describe("Run without a visible window (default false)."),
                browserArgs: z
                    .array(z.string().min(1))
                    .default([])
                    .describe("Extra command-line flags for the browser, e.g. ['--incognito']. Default none."),
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
                windowSize: windowSizeSchema,
                sessionId: z
                    .string()
                    .min(1)
                    .max(128)
                    .optional()
                    .describe("Optional readable id for the session, e.g. 'buyer' or 'admin' (1-128 chars). Defaults to a random UUID.")
            }
        },
        async ({ browser, headless, browserArgs, pageLoadTimeoutMs, scriptTimeoutMs, windowSize, sessionId }) => {
            try {
                const session = await driverManager.createSession(
                    {
                        browser,
                        headless,
                        browserArgs,
                        pageLoadTimeoutMs,
                        scriptTimeoutMs,
                        windowSize: windowSize ?? null
                    },
                    sessionId
                );

                return textResult(`Session created and selected: ${session.sessionId}.`, {
                    session,
                    status: driverManager.status()
                });
            } catch (err) {
                return errorResult(`Failed to create session: ${toErrorMessage(err)}`);
            }
        }
    );

    server.registerTool(
        "session_select",
        {
            description:
                "Make an existing browser session the active one, so every following tool call acts on that browser. " +
                "The other sessions stay open exactly as they were. Use session_list to see the available ids.",
            inputSchema: {
                sessionId: sessionIdSchema
            }
        },
        async ({ sessionId }) => {
            try {
                const session = driverManager.selectSession(sessionId);

                return textResult(`Session selected: ${session.sessionId}.`, {
                    session,
                    status: driverManager.status()
                });
            } catch (err) {
                return errorResult(`Failed to select session ${sessionId}: ${toErrorMessage(err)}`, {
                    sessionId
                });
            }
        }
    );

    server.registerTool(
        "session_list",
        {
            description:
                "List every open browser session (id, browser, headless, window size, start time) and which one is active. " +
                "Use it to find session ids for session_select or session_destroy, or to check what is still running."
        },
        async () => {
            try {
                const sessions = driverManager.listSessions();
                const status = driverManager.status();

                return textResult(`Found ${sessions.length} session(s).`, {
                    activeSessionId: status.activeSessionId,
                    sessions
                });
            } catch (err) {
                return errorResult(`Failed to list sessions: ${toErrorMessage(err)}`);
            }
        }
    );

    server.registerTool(
        "session_destroy",
        {
            description:
                "Close one browser session by id and quit its browser; its cookies, login state, and open pages are lost. " +
                "If it was the active session, another open session becomes active, or none if it was the last. " +
                "To close just the active session, stop_browser does the same.",
            inputSchema: {
                sessionId: sessionIdSchema
            }
        },
        async ({ sessionId }) => {
            try {
                const status = await driverManager.destroySession(sessionId);

                return textResult(`Session destroyed: ${sessionId}.`, {
                    status,
                    remainingSessions: driverManager.listSessions()
                });
            } catch (err) {
                return errorResult(`Failed to destroy session ${sessionId}: ${toErrorMessage(err)}`, {
                    sessionId
                });
            }
        }
    );
}
