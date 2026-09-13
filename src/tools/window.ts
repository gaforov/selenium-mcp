import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebDriver } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

type Size = {
    width: number;
    height: number;
};

type Sizes = {
    window: Size;
    viewport: Size;
};

type DevToolsCapable = {
    sendDevToolsCommand(cmd: string, params: object): Promise<void>;
};

// Chrome and Edge drivers can send DevTools (CDP) commands; Firefox cannot.
function devTools(driver: WebDriver): DevToolsCapable | null {
    const candidate = driver as unknown as Partial<DevToolsCapable>;

    return typeof candidate.sendDevToolsCommand === "function" ? (candidate as DevToolsCapable) : null;
}

function sameSize(a: Size, b: Size): boolean {
    return a.width === b.width && a.height === b.height;
}

async function readSizes(driver: WebDriver): Promise<Sizes> {
    const rect = await driver.manage().window().getRect();
    const viewport = await driver.executeScript<Size>(
        "return { width: window.innerWidth, height: window.innerHeight };"
    );

    return {
        window: { width: rect.width, height: rect.height },
        viewport
    };
}

// width/height target the viewport (the page area CSS media queries see), not the outer window.
async function resizeViewport(driver: WebDriver, target: Size): Promise<Sizes & { emulated: boolean }> {
    const cdp = devTools(driver);
    const browserWindow = driver.manage().window();

    // Drop any earlier emulated size so the real window size applies again.
    await cdp?.sendDevToolsCommand("Emulation.clearDeviceMetricsOverride", {});

    await browserWindow.setRect({ width: target.width, height: target.height });
    let sizes = await readSizes(driver);

    // Correct for browser UI around the page (toolbars, borders) in headed mode.
    if (!sameSize(sizes.viewport, target)) {
        await browserWindow.setRect({
            width: target.width + (sizes.window.width - sizes.viewport.width),
            height: target.height + (sizes.window.height - sizes.viewport.height)
        });
        sizes = await readSizes(driver);
    }

    // Chromium will not make a window narrower than about 500px, even headless. Device emulation
    // (what the DevTools device toolbar uses) sets the exact viewport instead.
    if (!sameSize(sizes.viewport, target) && cdp) {
        await cdp.sendDevToolsCommand("Emulation.setDeviceMetricsOverride", {
            width: target.width,
            height: target.height,
            deviceScaleFactor: 0,
            mobile: false
        });

        return { ...(await readSizes(driver)), emulated: true };
    }

    return { ...sizes, emulated: false };
}

function describeResize(target: Size, result: Sizes & { emulated: boolean }, canEmulate: boolean): string {
    const { width, height } = result.viewport;

    if (sameSize(result.viewport, target)) {
        return result.emulated
            ? `Resized viewport to ${width}x${height} using device emulation (the browser window cannot be made that small).`
            : `Resized viewport to ${width}x${height}.`;
    }

    const hint = canEmulate ? "" : " Exact small sizes need Chrome or Edge, which support device emulation.";
    return `Requested a ${target.width}x${target.height} viewport but got ${width}x${height}; the browser enforces a minimum window size.${hint}`;
}

export function registerWindowTool(server: McpServer): void {
    server.registerTool(
        "window",
        {
            description:
                "Manage browser tabs and windows, and resize the viewport. " +
                "list = all window handles plus the current one; switch = go to a handle from list; " +
                "switch_latest = go to the newest tab/window (e.g. after a link opened a new tab); " +
                "new_tab / new_window = open a blank one and switch to it; close = close the current one (then switch to another handle). " +
                "resize = set the viewport (page area) to width x height for responsive or mobile testing, e.g. 390x844 phone, 768x1024 tablet, 1920x1080 desktop " +
                "(exact phone sizes use device emulation on Chrome/Edge); maximize = maximize the window. " +
                "Returns window handles, or the resulting window and viewport sizes.",
            inputSchema: {
                action: z
                    .enum(["list", "switch", "switch_latest", "new_tab", "new_window", "close", "resize", "maximize"])
                    .describe(
                        "What to do: list | switch | switch_latest | new_tab | new_window | close | resize | maximize."
                    ),
                handle: z
                    .string()
                    .optional()
                    .describe("Window handle to switch to, as returned by action list. Required for switch; ignored otherwise."),
                width: z
                    .number()
                    .int()
                    .min(320)
                    .max(7680)
                    .optional()
                    .describe("Viewport width in CSS pixels for resize (e.g. 390 phone, 768 tablet, 1920 desktop). Required for resize."),
                height: z
                    .number()
                    .int()
                    .min(240)
                    .max(4320)
                    .optional()
                    .describe("Viewport height in CSS pixels for resize (e.g. 844 phone, 1024 tablet, 1080 desktop). Required for resize.")
            }
        },
        async ({ action, handle, width, height }) => {
            try {
                const driver = driverManager.getOrThrow();

                if (action === "list") {
                    const handles = await driver.getAllWindowHandles();
                    const currentHandle = await driver.getWindowHandle();

                    return textResult(`Found ${handles.length} window handle(s).`, {
                        handles,
                        currentHandle
                    });
                }

                if (action === "switch") {
                    if (!handle) {
                        return errorResult("Window handle is required when action is switch.", {
                            action
                        });
                    }

                    await driver.switchTo().window(handle);

                    return textResult(`Switched to window ${handle}.`, {
                        action,
                        handle
                    });
                }

                if (action === "switch_latest") {
                    const handles = await driver.getAllWindowHandles();
                    const latestHandle = handles.at(-1);

                    if (!latestHandle) {
                        return errorResult("No window handles are available.", {
                            action
                        });
                    }

                    await driver.switchTo().window(latestHandle);

                    return textResult(`Switched to latest window ${latestHandle}.`, {
                        action,
                        handle: latestHandle,
                        handles
                    });
                }

                if (action === "new_tab" || action === "new_window") {
                    const typeHint = action === "new_tab" ? "tab" : "window";
                    await driver.switchTo().newWindow(typeHint);
                    const currentHandle = await driver.getWindowHandle();
                    const handles = await driver.getAllWindowHandles();

                    return textResult(`Opened new ${typeHint}.`, {
                        action,
                        currentHandle,
                        handles
                    });
                }

                if (action === "resize") {
                    if (width === undefined || height === undefined) {
                        return errorResult(
                            "The resize action requires both width and height (viewport size in CSS pixels, e.g. 390 x 844 for a phone).",
                            { action, width, height }
                        );
                    }

                    const target = { width, height };
                    const result = await resizeViewport(driver, target);
                    driverManager.recordWindowSize(result.window);

                    return textResult(describeResize(target, result, devTools(driver) !== null), {
                        action,
                        requested: target,
                        ...result
                    });
                }

                if (action === "maximize") {
                    await devTools(driver)?.sendDevToolsCommand("Emulation.clearDeviceMetricsOverride", {});
                    await driver.manage().window().maximize();
                    const sizes = await readSizes(driver);
                    driverManager.recordWindowSize(sizes.window);

                    return textResult(
                        `Maximized window to ${sizes.window.width}x${sizes.window.height} (viewport ${sizes.viewport.width}x${sizes.viewport.height}).`,
                        { action, ...sizes }
                    );
                }

                await driver.close();

                return textResult("Closed current window.", {
                    action
                });
            } catch (err) {
                return errorResult(`Window action failed: ${toErrorMessage(err)}`, {
                    action,
                    handle
                });
            }
        }
    );
}
