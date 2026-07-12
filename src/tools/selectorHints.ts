import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorSchema } from "./shared/selector.js";
import { deleteSelectorHint, getSelectorHint, listSelectorHints, saveSelectorHint } from "./shared/selectorHints.js";

async function resolveDomain(domain?: string): Promise<string> {
    if (domain?.trim()) {
        return domain.trim().toLowerCase();
    }

    const driver = driverManager.getOrThrow();
    const currentUrl = await driver.getCurrentUrl();
    return new URL(currentUrl).hostname.toLowerCase();
}

export function registerSelectorHintTools(server: McpServer): void {
    server.registerTool(
        "selector_hint_save",
        {
            description: "Persist a named selector hint for a domain.",
            inputSchema: {
                key: z.string().min(1).max(128),
                selector: selectorSchema,
                domain: z.string().min(1).optional()
            }
        },
        async ({ key, selector, domain }) => {
            try {
                const resolvedDomain = await resolveDomain(domain);
                const hint = await saveSelectorHint(resolvedDomain, key, selector);

                return textResult(`Saved selector hint ${hint.key} for ${hint.domain}.`, {
                    hint
                });
            } catch (err) {
                return errorResult(`Failed to save selector hint: ${toErrorMessage(err)}`, {
                    key,
                    domain
                });
            }
        }
    );

    server.registerTool(
        "selector_hint_get",
        {
            description: "Resolve a selector hint by key and domain.",
            inputSchema: {
                key: z.string().min(1).max(128),
                domain: z.string().min(1).optional()
            }
        },
        async ({ key, domain }) => {
            try {
                const resolvedDomain = await resolveDomain(domain);
                const hint = await getSelectorHint(resolvedDomain, key);
                if (!hint) {
                    return errorResult(`Selector hint not found for key ${key}.`, {
                        key,
                        domain: resolvedDomain
                    });
                }

                return textResult(`Resolved selector hint ${hint.key} for ${hint.domain}.`, {
                    hint
                });
            } catch (err) {
                return errorResult(`Failed to resolve selector hint: ${toErrorMessage(err)}`, {
                    key,
                    domain
                });
            }
        }
    );

    server.registerTool(
        "selector_hint_list",
        {
            description: "List selector hints, optionally filtered by domain.",
            inputSchema: {
                domain: z.string().min(1).optional()
            }
        },
        async ({ domain }) => {
            try {
                const hints = await listSelectorHints(domain?.trim().toLowerCase());
                return textResult(`Found ${hints.length} selector hint(s).`, {
                    domain: domain?.trim().toLowerCase() ?? null,
                    hints
                });
            } catch (err) {
                return errorResult(`Failed to list selector hints: ${toErrorMessage(err)}`, {
                    domain
                });
            }
        }
    );

    server.registerTool(
        "selector_hint_delete",
        {
            description: "Delete a selector hint by key and domain.",
            inputSchema: {
                key: z.string().min(1).max(128),
                domain: z.string().min(1).optional()
            }
        },
        async ({ key, domain }) => {
            try {
                const resolvedDomain = await resolveDomain(domain);
                const deleted = await deleteSelectorHint(resolvedDomain, key);
                if (!deleted) {
                    return errorResult(`Selector hint not found for key ${key}.`, {
                        key,
                        domain: resolvedDomain
                    });
                }

                return textResult(`Deleted selector hint ${key} for ${resolvedDomain}.`, {
                    key,
                    domain: resolvedDomain
                });
            } catch (err) {
                return errorResult(`Failed to delete selector hint: ${toErrorMessage(err)}`, {
                    key,
                    domain
                });
            }
        }
    );
}
