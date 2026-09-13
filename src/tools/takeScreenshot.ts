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
            description:
                "Capture a PNG screenshot of the visible viewport. Returns it as base64 and/or saves it to savePath (folders are created as needed; an existing file is overwritten). " +
                "Use it when visual layout or appearance matters, or to show the user a step. " +
                "To check text or state, prefer capture_page, get_text, or the assert tools: they are exact and much smaller than an image.",
            inputSchema: {
                includeBase64: z
                    .boolean()
                    .default(true)
                    .describe("Include the PNG as base64 in the result (default true). Set false when saving to disk to keep the response small."),
                savePath: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Absolute path to write the PNG to, e.g. '/home/me/shots/login.png' or 'C:/shots/login.png'. Omit to not save.")
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
