import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { driverManager } from "../driver/driverManager.js";

interface AccessibilityNode {
    role: string;
    name: string;
    tag: string;
    id: string;
    text: string;
}

export function registerCoreResources(server: McpServer): void {
    server.registerResource(
        "browser-status",
        "browser-status://current",
        {
            title: "Current browser status",
            description: "Current Selenium browser session status.",
            mimeType: "application/json"
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(driverManager.status(), null, 2)
                }
            ]
        })
    );

    server.registerResource(
        "accessibility-snapshot",
        "accessibility://current",
        {
            title: "Current page accessibility snapshot",
            description: "Compact DOM-derived accessibility snapshot of visible interactive elements and headings.",
            mimeType: "application/json"
        },
        async (uri) => {
            try {
                const driver = driverManager.getOrThrow();
                const nodes = await driver.executeScript<AccessibilityNode[]>(`
                    const selectors = [
                        'a', 'button', 'input', 'select', 'textarea',
                        '[role]', '[aria-label]', '[aria-labelledby]',
                        'h1', 'h2', 'h3'
                    ];

                    function isVisible(element) {
                        const style = window.getComputedStyle(element);
                        const rect = element.getBoundingClientRect();
                        return style.visibility !== 'hidden' &&
                            style.display !== 'none' &&
                            rect.width > 0 &&
                            rect.height > 0;
                    }

                    function labelFor(element) {
                        const labelledBy = element.getAttribute('aria-labelledby');
                        if (labelledBy) {
                            return labelledBy
                                .split(/\\s+/)
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

                    return Array.from(document.querySelectorAll(selectors.join(',')))
                        .filter(isVisible)
                        .slice(0, 200)
                        .map((element) => ({
                            role: element.getAttribute('role') || element.tagName.toLowerCase(),
                            name: String(labelFor(element)).trim().slice(0, 200),
                            tag: element.tagName.toLowerCase(),
                            id: element.id || '',
                            text: String(element.innerText || '').trim().slice(0, 200)
                        }));
                `);

                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: "application/json",
                            text: JSON.stringify({ nodes }, null, 2)
                        }
                    ]
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";

                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: "application/json",
                            text: JSON.stringify({ error: message }, null, 2)
                        }
                    ]
                };
            }
        }
    );
}
