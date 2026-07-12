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

export function registerSessionTools(server: McpServer): void {
    server.registerTool(
        "session_create",
        {
            description: "Create a new browser session and select it as active.",
            inputSchema: {
                browser: z.enum(SUPPORTED_BROWSERS).default("chrome"),
                headless: z.boolean().default(false),
                browserArgs: z.array(z.string().min(1)).default([]),
                pageLoadTimeoutMs: z.number().int().min(1000).max(300000).default(30000),
                scriptTimeoutMs: z.number().int().min(1000).max(300000).default(30000),
                windowSize: windowSizeSchema,
                sessionId: z.string().min(1).max(128).optional()
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
            description: "Select an existing browser session as active.",
            inputSchema: {
                sessionId: z.string().min(1)
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
            description: "List all active browser sessions."
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
            description: "Destroy a specific browser session.",
            inputSchema: {
                sessionId: z.string().min(1)
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
