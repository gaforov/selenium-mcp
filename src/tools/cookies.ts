import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IWebDriverOptionsCookie } from "selenium-webdriver/lib/webdriver.js";
import * as z from "zod/v4";
import { driverManager } from "../driver/driverManager.js";
import { errorResult, textResult, toErrorMessage } from "../utils/toolResult.js";

const sameSiteSchema = z.enum(["Strict", "Lax", "None"]).optional();

export function registerCookieTools(server: McpServer): void {
    server.registerTool(
        "add_cookie",
        {
            description: "Add a browser cookie for the current page domain.",
            inputSchema: {
                name: z.string().min(1),
                value: z.string(),
                path: z.string().optional(),
                domain: z.string().optional(),
                secure: z.boolean().optional(),
                httpOnly: z.boolean().optional(),
                expiry: z.number().int().positive().optional(),
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
            description: "Get all cookies or one cookie by name.",
            inputSchema: {
                name: z.string().min(1).optional()
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
            description: "Delete one cookie by name, or all cookies when name is omitted.",
            inputSchema: {
                name: z.string().min(1).optional()
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
