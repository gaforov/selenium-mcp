import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IWebDriverOptionsCookie } from "selenium-webdriver/lib/webdriver.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const sameSiteSchema = z
    .enum(["Strict", "Lax", "None"])
    .optional()
    .describe("SameSite policy: Strict, Lax, or None (None also requires secure: true). Omit for the browser default.");

export function registerCookieTools(server: McpServer): void {
    server.registerTool(
        "add_cookie",
        {
            description:
                "Set a cookie in the browser, e.g. a session or feature-flag cookie to skip a login screen or switch on a test mode. " +
                "Browsers only accept cookies for the site that is currently open, so navigate to a page on that domain first. " +
                "The page does not see the cookie until its next request, so refresh (history) or navigate afterwards. Setting an existing name replaces that cookie.",
            inputSchema: {
                name: z.string().min(1).describe("Cookie name, e.g. 'session_id'."),
                value: z.string().describe("Cookie value."),
                path: z.string().optional().describe("URL path the cookie applies to (default '/')."),
                domain: z
                    .string()
                    .optional()
                    .describe("Domain the cookie applies to, e.g. '.example.com' to include subdomains. Defaults to the current page's host."),
                secure: z.boolean().optional().describe("Only send the cookie over HTTPS."),
                httpOnly: z.boolean().optional().describe("Hide the cookie from page JavaScript (document.cookie)."),
                expiry: z
                    .number()
                    .int()
                    .positive()
                    .optional()
                    .describe("Expiry as a Unix timestamp in seconds. Omit for a session cookie that ends when the browser closes."),
                sameSite: sameSiteSchema
            }
        },
        async ({ name, value, path, domain, secure, httpOnly, expiry, sameSite }) => {
            try {
                const driver = driverManager.getOrThrow();
                const cookie: IWebDriverOptionsCookie = {
                    name,
                    value
                };

                if (path !== undefined) {
                    cookie.path = path;
                }

                if (domain !== undefined) {
                    cookie.domain = domain;
                }

                if (secure !== undefined) {
                    cookie.secure = secure;
                }

                if (httpOnly !== undefined) {
                    cookie.httpOnly = httpOnly;
                }

                if (expiry !== undefined) {
                    cookie.expiry = expiry;
                }

                if (sameSite !== undefined) {
                    cookie.sameSite = sameSite;
                }

                await driver.manage().addCookie(cookie);

                return textResult(`Added cookie ${name}.`, {
                    name,
                    domain,
                    path
                });
            } catch (err) {
                return errorResult(`Failed to add cookie ${name}: ${toErrorMessage(err)}`, {
                    name,
                    domain,
                    path
                });
            }
        }
    );

    server.registerTool(
        "get_cookies",
        {
            description:
                "Read the cookies the browser holds for the current page: all of them, or one by name. " +
                "Includes httpOnly cookies that page JavaScript cannot see. Returns each cookie's name, value, domain, path, expiry, and flags. " +
                "Useful to check that a login created a session cookie, or to copy one into another session with add_cookie.",
            inputSchema: {
                name: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Name of one cookie to read, e.g. 'session_id'. Omit to read all cookies for the current page.")
            }
        },
        async ({ name }) => {
            try {
                const driver = driverManager.getOrThrow();

                if (name) {
                    const cookie = await driver.manage().getCookie(name);

                    return textResult(`Read cookie ${name}.`, {
                        cookie
                    });
                }

                const cookies = await driver.manage().getCookies();

                return textResult(`Read ${cookies.length} cookie(s).`, {
                    cookies
                });
            } catch (err) {
                return errorResult(`Failed to get cookies: ${toErrorMessage(err)}`, {
                    name
                });
            }
        }
    );

    server.registerTool(
        "delete_cookie",
        {
            description:
                "Delete one cookie by name, or every cookie for the current page when name is omitted. " +
                "Deleting all cookies usually logs the user out and resets consent banners and preferences; it cannot be undone. " +
                "The page notices on its next request, so refresh (history) or navigate afterwards.",
            inputSchema: {
                name: z
                    .string()
                    .min(1)
                    .optional()
                    .describe("Name of the cookie to delete, e.g. 'session_id'. Omit to delete ALL cookies for the current page.")
            }
        },
        async ({ name }) => {
            try {
                const driver = driverManager.getOrThrow();

                if (name) {
                    await driver.manage().deleteCookie(name);

                    return textResult(`Deleted cookie ${name}.`, {
                        name
                    });
                }

                await driver.manage().deleteAllCookies();

                return textResult("Deleted all cookies.");
            } catch (err) {
                return errorResult(`Failed to delete cookies: ${toErrorMessage(err)}`, {
                    name
                });
            }
        }
    );
}
