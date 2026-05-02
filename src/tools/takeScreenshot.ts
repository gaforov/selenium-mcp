import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute } from "node:path";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

export function registerTakeScreenshotTool(server: McpServer): void {
    server.registerTool(
        "take_screenshot",
        {
            description: "Capture a PNG screenshot and optionally save it to disk.",
            inputSchema: {
                includeBase64: z.boolean().default(true),
                savePath: z.string().min(1).optional()
            }
        },
        async ({ includeBase64, savePath }) => {
            try {
                if (savePath && !isAbsolute(savePath)) {
                    return errorResult("savePath must be an absolute path.", { savePath });
                }

                const driver = driverManager.getOrThrow();
                const base64 = await driver.takeScreenshot();
                const pngBuffer = Buffer.from(base64, "base64");

                if (savePath) {
                    await mkdir(dirname(savePath), { recursive: true });
                    await writeFile(savePath, pngBuffer);
                }

                return textResult("Captured screenshot.", {
                    mimeType: "image/png",
                    base64Length: base64.length,
                    byteLength: pngBuffer.length,
                    savePath,
                    saved: Boolean(savePath),
                    base64: includeBase64 ? base64 : undefined
                });
            } catch (err) {
                return errorResult(toErrorMessage(err), { savePath });
            }
        }
    );
}
