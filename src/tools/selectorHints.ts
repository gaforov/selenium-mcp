import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";
import { selectorSchema } from "./shared/selector.js";
import { deleteSelectorHint, getSelectorHint, listSelectorHints, saveSelectorHint } from "./shared/selectorHints.js";

const keySchema = z
    .string()
    .min(1)
    .max(128)
    .describe("Short name for the element, e.g. 'login_button' or 'search_box' (1-128 chars).");

const domainSchema = z
    .string()
    .min(1)
    .optional()
    .describe("Site hostname, e.g. 'www.saucedemo.com'. Defaults to the hostname of the page currently open.");

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
            description:
                "Remember a selector that worked, under a short key for a site, so later runs can reuse it instead of rediscovering the element. " +
                "Hints are saved to a JSON file on disk (.selenium-mcp/selector-hints.json in the server's working directory, or SELENIUM_MCP_SELECTOR_HINTS_PATH) and survive restarts. " +
                "Save a hint after a selector has worked, e.g. after a successful click. Returns the saved hint.",
            inputSchema: {
                key: keySchema,
                selector: selectorSchema,
                domain: domainSchema
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
            description:
                "Look up a saved selector by key for a site and return it, ready to pass as the selector of click, type, get_text, and similar tools. " +
                "Fails if no hint with that key exists for the domain; use selector_hint_list to see what is saved.",
            inputSchema: {
                key: keySchema,
                domain: domainSchema
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
            description:
                "List saved selector hints (key, domain, and selector) for every site, or only for one domain. " +
                "Check this at the start of a run on a familiar site to reuse known selectors. Does not need a browser to be running.",
            inputSchema: {
                domain: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Only list hints for this hostname, e.g. 'www.saucedemo.com'. Omit to list hints for every site.")
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
            description:
                "Permanently remove a saved selector hint from the hints file, e.g. when the site changed and the selector no longer works. " +
                "This cannot be undone; save a corrected hint with selector_hint_save. Fails if no hint with that key exists for the domain.",
            inputSchema: {
                key: keySchema,
                domain: domainSchema
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
