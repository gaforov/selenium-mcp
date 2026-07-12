import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { SelectorInput } from "./selector.js";

const HINTS_PATH_ENV = "SELENIUM_MCP_SELECTOR_HINTS_PATH";
const DEFAULT_HINTS_PATH = ".selenium-mcp/selector-hints.json";

type SelectorHintRecord = {
    domain: string;
    key: string;
    selector: SelectorInput;
    updatedAt: string;
    hits: number;
};

type SelectorHintsFile = {
    version: 1;
    hints: SelectorHintRecord[];
};

function getHintsPath(): string {
    return resolve(process.env[HINTS_PATH_ENV]?.trim() || DEFAULT_HINTS_PATH);
}

async function readHintsFile(): Promise<SelectorHintsFile> {
    const filePath = getHintsPath();

    try {
        const raw = await readFile(filePath, "utf8");
        const parsed = JSON.parse(raw) as SelectorHintsFile;
        if (!Array.isArray(parsed.hints)) {
            return { version: 1, hints: [] };
        }

        return {
            version: 1,
            hints: parsed.hints
        };
    } catch {
        return { version: 1, hints: [] };
    }
}

async function writeHintsFile(content: SelectorHintsFile): Promise<void> {
    const filePath = getHintsPath();
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(content, null, 2), "utf8");
}

export async function saveSelectorHint(domain: string, key: string, selector: SelectorInput): Promise<SelectorHintRecord> {
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedKey = key.trim().toLowerCase();
    const now = new Date().toISOString();
    const file = await readHintsFile();

    const existing = file.hints.find((entry) => entry.domain === normalizedDomain && entry.key === normalizedKey);
    if (existing) {
        existing.selector = selector;
        existing.updatedAt = now;
        await writeHintsFile(file);
        return existing;
    }

    const record: SelectorHintRecord = {
        domain: normalizedDomain,
        key: normalizedKey,
        selector,
        updatedAt: now,
        hits: 0
    };

    file.hints.push(record);
    await writeHintsFile(file);
    return record;
}

export async function getSelectorHint(domain: string, key: string): Promise<SelectorHintRecord | null> {
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedKey = key.trim().toLowerCase();
    const file = await readHintsFile();
    const existing = file.hints.find((entry) => entry.domain === normalizedDomain && entry.key === normalizedKey);

    if (!existing) {
        return null;
    }

    existing.hits += 1;
    existing.updatedAt = new Date().toISOString();
    await writeHintsFile(file);
    return existing;
}

export async function listSelectorHints(domain?: string): Promise<SelectorHintRecord[]> {
    const file = await readHintsFile();
    if (!domain) {
        return file.hints;
    }

    const normalizedDomain = domain.trim().toLowerCase();
    return file.hints.filter((entry) => entry.domain === normalizedDomain);
}

export async function deleteSelectorHint(domain: string, key: string): Promise<boolean> {
    const normalizedDomain = domain.trim().toLowerCase();
    const normalizedKey = key.trim().toLowerCase();
    const file = await readHintsFile();
    const nextHints = file.hints.filter((entry) => !(entry.domain === normalizedDomain && entry.key === normalizedKey));

    if (nextHints.length === file.hints.length) {
        return false;
    }

    await writeHintsFile({ version: 1, hints: nextHints });
    return true;
}
