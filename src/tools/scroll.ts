import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebElement } from "selenium-webdriver";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { timeoutMsSchema } from "./shared/selector.js";
import { resolveSelectorFromTarget, selectorOrRefInputSchema } from "./shared/targetSelector.js";
import { waitForLocatedElement } from "./shared/waits.js";

type ScrollMode = "into_view" | "to" | "by";

type ScrollState = {
    scrollTop: number;
    scrollLeft: number;
    scrollHeight: number;
    viewportHeight: number;
    atTop: boolean;
    atBottom: boolean;
    inViewport: boolean | null;
};

// Scrolls and measures in one round trip. With an element and mode "to"/"by", the element is the
// scrollable container; otherwise the page is scrolled. behavior "instant" overrides any CSS
// smooth scrolling, so the returned position is final.
const SCROLL_SCRIPT = `
    const [element, mode, to, deltaX, deltaY] = arguments;
    const page = document.scrollingElement || document.documentElement;
    const box = element && mode !== "into_view" ? element : page;

    if (mode === "into_view") {
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    } else if (mode === "to") {
        box.scrollTo({ top: to === "top" ? 0 : box.scrollHeight, left: box.scrollLeft, behavior: "instant" });
    } else {
        box.scrollBy({ left: deltaX, top: deltaY, behavior: "instant" });
    }

    let inViewport = null;
    if (mode === "into_view") {
        const rect = element.getBoundingClientRect();
        inViewport = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    return {
        scrollTop: Math.round(box.scrollTop),
        scrollLeft: Math.round(box.scrollLeft),
        scrollHeight: box.scrollHeight,
        viewportHeight: box.clientHeight,
        atTop: box.scrollTop <= 0,
        atBottom: Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight - 1,
        inViewport
    };
`;

function describeScroll(
    mode: ScrollMode,
    where: string,
    state: ScrollState,
    to: "top" | "bottom" | undefined,
    deltaX: number,
    deltaY: number
): string {
    if (mode === "into_view") {
        return state.inViewport
            ? `Scrolled ${where} into view.`
            : `Scrolled to ${where}, but it is still outside the viewport (it may be hidden or clipped by a container).`;
    }

    const moved = mode === "to" ? `Scrolled ${where} to the ${to}.` : `Scrolled ${where} by (${deltaX}, ${deltaY}).`;

    return state.atBottom ? `${moved} Reached the bottom.` : moved;
}

export function registerScrollTool(server: McpServer): void {
    server.registerTool(
        "scroll",
        {
            description:
                "Scroll the page: scroll down or up by pixels, jump to the top or bottom, or scroll an element into view (to the middle of the screen). " +
                "Also scrolls inside a scrollable container (chat panels, tables, sidebars with their own scrollbar) when you pass that container as selector/ref together with to or deltaX/deltaY. " +
                "Returns the scroll position with atTop/atBottom flags. " +
                "For lazy-loaded or infinite-scroll pages ('load more' on scroll), scroll to the bottom, wait_for_element for the new items, and repeat until atBottom stays true and nothing new appears. " +
                "click and type already scroll their target into view, so use this to reveal content or trigger lazy loading.",
            inputSchema: {
                selector: selectorOrRefInputSchema.shape.selector.describe(
                    "Element to scroll to, brought to the middle of the screen. If you also pass to or deltaX/deltaY, this element is instead the scrollable container to scroll inside. Provide selector or ref, not both."
                ),
                ref: selectorOrRefInputSchema.shape.ref.describe(
                    "Element ref from capture_page (e.g. 'e12'); same meaning as selector."
                ),
                to: z
                    .enum(["top", "bottom"])
                    .optional()
                    .describe(
                        "Jump to the top or bottom of the page, or of the container given by selector/ref. Scrolling to the bottom is how infinite-scroll pages load more items."
                    ),
                deltaX: z
                    .number()
                    .int()
                    .optional()
                    .describe("Pixels to scroll horizontally: positive = right, negative = left."),
                deltaY: z
                    .number()
                    .int()
                    .optional()
                    .describe("Pixels to scroll vertically: positive = down, negative = up (e.g. 800 for about one screen)."),
                timeoutMs: timeoutMsSchema.describe(
                    "How long to wait for the selector/ref element to exist, in milliseconds (default 10000)."
                )
            }
        },
        async ({ selector, ref, to, deltaX, deltaY, timeoutMs }) => {
            const hasTarget = Boolean(selector || ref);
            const hasDelta = deltaX !== undefined || deltaY !== undefined;
            let label = "the page";

            try {
                if (to !== undefined && hasDelta) {
                    throw new Error("Use either to or deltaX/deltaY, not both.");
                }

                if (!hasTarget && to === undefined && !hasDelta) {
                    throw new Error(
                        "Provide an element (selector or ref) to scroll into view, to: 'top' | 'bottom', or deltaX/deltaY pixels."
                    );
                }

                let mode: ScrollMode = "into_view";
                if (to !== undefined) {
                    mode = "to";
                } else if (hasDelta) {
                    mode = "by";
                }

                const driver = driverManager.getOrThrow();
                let element: WebElement | null = null;

                if (hasTarget) {
                    const target = await resolveSelectorFromTarget({ selector, ref });
                    label = target.label;
                    element = await waitForLocatedElement(driver, target.selector, timeoutMs);
                }

                const state = await driver.executeScript<ScrollState>(
                    SCROLL_SCRIPT,
                    element,
                    mode,
                    to ?? null,
                    deltaX ?? 0,
                    deltaY ?? 0
                );
                const scrolledContainer = element !== null && mode !== "into_view";
                const where = scrolledContainer ? `container ${label}` : label;

                return textResult(describeScroll(mode, where, state, to, deltaX ?? 0, deltaY ?? 0), {
                    mode,
                    container: scrolledContainer ? "element" : "page",
                    ...state
                });
            } catch (err) {
                return errorResult(`Failed to scroll ${label}: ${toErrorMessage(err)}`, {
                    selector,
                    ref,
                    to,
                    deltaX,
                    deltaY
                });
            }
        }
    );
}
