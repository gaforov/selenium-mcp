import { Builder, type WebDriver } from "selenium-webdriver";
import { randomUUID } from "node:crypto";
import chrome from "selenium-webdriver/chrome.js";
import edge from "selenium-webdriver/edge.js";
import firefox from "selenium-webdriver/firefox.js";

export const SUPPORTED_BROWSERS = ["chrome", "firefox", "edge"] as const;

export type BrowserName = (typeof SUPPORTED_BROWSERS)[number];

export interface StartBrowserOptions {
    browser: BrowserName;
    headless: boolean;
    browserArgs: string[];
    pageLoadTimeoutMs: number;
    scriptTimeoutMs: number;
    windowSize: {
        width: number;
        height: number;
    } | null;
}

export interface BrowserSessionStatus {
    sessionId: string;
    browser: BrowserName;
    headless: boolean;
    browserArgs: string[];
    windowSize: {
        width: number;
        height: number;
    } | null;
    startedAt: string;
}

export interface BrowserStatus {
    running: boolean;
    browser: BrowserName | null;
    headless: boolean | null;
    browserArgs: string[];
    windowSize: {
        width: number;
        height: number;
    } | null;
    startedAt: string | null;
    activeSessionId: string | null;
    sessionCount: number;
}

interface ManagedSession {
    sessionId: string;
    driver: WebDriver;
    browser: BrowserName;
    headless: boolean;
    browserArgs: string[];
    windowSize: {
        width: number;
        height: number;
    } | null;
    startedAt: string;
}

class DriverManager {
    private sessions = new Map<string, ManagedSession>();
    private activeSessionId: string | null = null;

    async start(options: StartBrowserOptions): Promise<BrowserStatus> {
        if (this.sessions.size > 0) {
            throw new Error(
                "A browser session is already running. Use stop_browser first or use session_create for multi-session flows."
            );
        }

        await this.createSession(options);

        return this.status();
    }

    async createSession(options: StartBrowserOptions, requestedSessionId?: string): Promise<BrowserSessionStatus> {
        const sessionId = requestedSessionId?.trim() || randomUUID();

        if (this.sessions.has(sessionId)) {
            throw new Error(`Session already exists: ${sessionId}`);
        }

        const driver = await this.buildDriver(options);
        const startedAt = new Date().toISOString();

        await driver.manage().setTimeouts({
            implicit: 0,
            pageLoad: options.pageLoadTimeoutMs,
            script: options.scriptTimeoutMs
        });

        if (options.windowSize) {
            await driver.manage().window().setRect({
                width: options.windowSize.width,
                height: options.windowSize.height
            });
        }

        const session: ManagedSession = {
            sessionId,
            driver,
            browser: options.browser,
            headless: options.headless,
            browserArgs: options.browserArgs,
            windowSize: options.windowSize,
            startedAt
        };

        this.sessions.set(sessionId, session);
        this.activeSessionId = sessionId;

        return this.toSessionStatus(session);
    }

    getOrThrow(): WebDriver {
        const active = this.getActiveSession();

        if (!active) {
            throw new Error("Browser is not running. Call start_browser first.");
        }

        return active.driver;
    }

    getActiveSessionId(): string | null {
        return this.activeSessionId;
    }

    listSessions(): BrowserSessionStatus[] {
        return Array.from(this.sessions.values()).map((session) => this.toSessionStatus(session));
    }

    selectSession(sessionId: string): BrowserSessionStatus {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        this.activeSessionId = sessionId;
        return this.toSessionStatus(session);
    }

    async destroySession(sessionId: string): Promise<BrowserStatus> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        try {
            await session.driver.quit();
        } finally {
            this.sessions.delete(sessionId);

            if (this.activeSessionId === sessionId) {
                const nextSession = this.sessions.keys().next().value;
                this.activeSessionId = nextSession ?? null;
            }
        }

        return this.status();
    }

    async stop(): Promise<BrowserStatus> {
        const activeSessionId = this.activeSessionId;

        if (!activeSessionId) {
            return this.status();
        }

        return this.destroySession(activeSessionId);
    }

    async stopAll(): Promise<BrowserStatus> {
        const sessionIds = Array.from(this.sessions.keys());

        for (const sessionId of sessionIds) {
            await this.destroySession(sessionId);
        }

        return this.status();
    }

    status(): BrowserStatus {
        const active = this.getActiveSession();

        return {
            running: active !== undefined,
            browser: active?.browser ?? null,
            headless: active?.headless ?? null,
            browserArgs: active?.browserArgs ?? [],
            windowSize: active?.windowSize ?? null,
            startedAt: active?.startedAt ?? null,
            activeSessionId: this.activeSessionId,
            sessionCount: this.sessions.size
        };
    }

    private getActiveSession(): ManagedSession | undefined {
        if (!this.activeSessionId) {
            return undefined;
        }

        return this.sessions.get(this.activeSessionId);
    }

    private toSessionStatus(session: ManagedSession): BrowserSessionStatus {
        return {
            sessionId: session.sessionId,
            browser: session.browser,
            headless: session.headless,
            browserArgs: session.browserArgs,
            windowSize: session.windowSize,
            startedAt: session.startedAt
        };
    }

    private async buildDriver({ browser, headless, browserArgs }: StartBrowserOptions): Promise<WebDriver> {
        const builder = new Builder();

        switch (browser) {
            case "chrome": {
                const options = new chrome.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                options.addArguments("--disable-dev-shm-usage");
                options.addArguments(...browserArgs);
                builder.forBrowser("chrome").setChromeOptions(options);
                break;
            }
            case "firefox": {
                const options = new firefox.Options();

                if (headless) {
                    options.addArguments("-headless");
                }

                options.addArguments(...browserArgs);
                builder.forBrowser("firefox").setFirefoxOptions(options);
                break;
            }
            case "edge": {
                const options = new edge.Options();

                if (headless) {
                    options.addArguments("--headless=new");
                }

                options.addArguments(...browserArgs);
                builder.forBrowser("MicrosoftEdge").setEdgeOptions(options);
                break;
            }
        }

        return builder.build();
    }
}

export const driverManager = new DriverManager();
