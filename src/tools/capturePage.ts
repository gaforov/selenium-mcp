import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { setPageRefs } from "./shared/pageRefs.js";
import type { SelectorInput } from "./shared/selector.js";

type CapturedNode = {
    ref: string;
    role: string;
    name: string;
    tag: string;
    id: string;
    text: string;
    selector: SelectorInput;
};

const capturePageSchema = {
    maxElements: z
        .number()
        .int()
        .min(10)
        .max(500)
        .default(200)
        .describe("Maximum elements to return, 10-500 (default 200). Lower it on very large pages to keep the result small.")
};

export function registerCapturePageTool(server: McpServer): void {
    server.registerTool(
        "capture_page",
        {
            description:
                "Snapshot the page's visible interactive elements and headings (links, buttons, inputs, selects, textareas, ARIA roles, h1-h4) " +
                "with stable refs e1, e2, ... and a reusable selector for each. Pass a ref to click, type, get_text, select_option, interact, or scroll " +
                "instead of guessing a selector. Refs belong to this snapshot, so capture again after navigation or major page changes. " +
                "Prefer this over screenshots or get_page_source to understand what is on the page.",
            inputSchema: capturePageSchema
        },
        async ({ maxElements }) => {
            try {
                const driver = driverManager.getOrThrow();
                const sessionId = driverManager.getActiveSessionId();

                if (!sessionId) {
                    return errorResult("No active session. Start or select a session first.");
                }

                const nodes = await driver.executeScript<CapturedNode[]>(
                    `
                    const selectors = [
                        'a', 'button', 'input', 'select', 'textarea',
                        '[role]', '[aria-label]', '[aria-labelledby]',
                        'h1', 'h2', 'h3', 'h4'
                    ];

                    function isVisible(element) {
                        const style = window.getComputedStyle(element);
                        const rect = element.getBoundingClientRect();
                        return style.visibility !== 'hidden' &&
                            style.display !== 'none' &&
                            rect.width > 0 &&
                            rect.height > 0;
                    }

                    function cssPath(element) {
                        const segments = [];
                        let current = element;
                        let depth = 0;

                        while (current && current.nodeType === Node.ELEMENT_NODE && depth < 6) {
                            const tag = current.tagName.toLowerCase();
                            if (current.id) {
                                segments.unshift('#' + CSS.escape(current.id));
                                break;
                            }

                            const parent = current.parentElement;
                            if (!parent) {
                                segments.unshift(tag);
                                break;
                            }

                            const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
                            if (siblings.length === 1) {
                                segments.unshift(tag);
                            } else {
                                const index = siblings.indexOf(current) + 1;
                                segments.unshift(tag + ':nth-of-type(' + index + ')');
                            }

                            current = parent;
                            depth += 1;
                        }

                        return segments.join(' > ');
                    }

                    function labelFor(element) {
                        const labelledBy = element.getAttribute('aria-labelledby');
                        if (labelledBy) {
                            return labelledBy
                                .split(/\s+/)
                                .map((id) => document.getElementById(id)?.innerText?.trim())
                                .filter(Boolean)
                                .join(' ');
                        }

                        return element.getAttribute('aria-label') ||
                            element.getAttribute('alt') ||
                            element.getAttribute('title') ||
                            element.innerText ||
                            element.value ||
                            '';
                    }

                    const nodes = Array.from(document.querySelectorAll(selectors.join(',')))
                        .filter(isVisible)
                        .slice(0, ${maxElements})
                        .map((element, idx) => {
                            const id = element.id || '';
                            const name = element.getAttribute('name') || '';
                            const selector = id
                                ? { by: 'id', value: id }
                                : name
                                    ? { by: 'name', value: name }
                                    : { by: 'css', value: cssPath(element) };

                            return {
                                ref: 'e' + (idx + 1),
                                role: element.getAttribute('role') || element.tagName.toLowerCase(),
                                name: String(labelFor(element)).trim().slice(0, 200),
                                tag: element.tagName.toLowerCase(),
                                id,
                                text: String(element.innerText || '').trim().slice(0, 200),
                                selector
                            };
                        });

                    return nodes;
                    `
                );

                setPageRefs(
                    sessionId,
                    nodes.map((node) => ({
                        ref: node.ref,
                        selector: node.selector
                    }))
                );

                return textResult(`Captured ${nodes.length} page element refs.`, {
                    sessionId,
                    count: nodes.length,
                    nodes
                });
            } catch (err) {
                return errorResult(`Failed to capture page: ${toErrorMessage(err)}`);
            }
        }
    );
}
