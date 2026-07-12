import type { SelectorInput } from "./selector.js";

const refsBySession = new Map<string, Map<string, SelectorInput>>();

export function setPageRefs(sessionId: string, refs: Array<{ ref: string; selector: SelectorInput }>): void {
    const refMap = new Map<string, SelectorInput>();

    for (const entry of refs) {
        refMap.set(entry.ref, entry.selector);
    }

    refsBySession.set(sessionId, refMap);
}

export function getSelectorByRef(sessionId: string, ref: string): SelectorInput | null {
    const refMap = refsBySession.get(sessionId);
    if (!refMap) {
        return null;
    }

    return refMap.get(ref) ?? null;
}

export function clearPageRefs(sessionId: string): void {
    refsBySession.delete(sessionId);
}
