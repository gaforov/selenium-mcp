export type Size = {
    width: number;
    height: number;
};

export function sameSize(a: Size, b: Size): boolean {
    return a.width === b.width && a.height === b.height;
}

// Device emulation only helps when the window ended up bigger than requested, because browsers
// enforce a minimum window size. When it ended up smaller, the screen is the limit: emulating
// would lay the page out larger than the window you can see, so report the real size instead.
export function shouldEmulate(viewport: Size, target: Size): boolean {
    return !sameSize(viewport, target) && viewport.width >= target.width && viewport.height >= target.height;
}

export function describeResize(target: Size, result: { viewport: Size; emulated: boolean }, canEmulate: boolean): string {
    const { width, height } = result.viewport;

    if (sameSize(result.viewport, target)) {
        return result.emulated
            ? `Resized viewport to ${width}x${height} using device emulation (the browser window cannot be made that small).`
            : `Resized viewport to ${width}x${height}.`;
    }

    const requested = `Requested a ${target.width}x${target.height} viewport but got ${width}x${height}`;

    if (width < target.width || height < target.height) {
        return `${requested}; the screen is too small for a window that size. Headless mode allows larger sizes.`;
    }

    const hint = canEmulate ? "" : " Exact small sizes need Chrome or Edge, which support device emulation.";
    return `${requested}; the browser enforces a minimum window size.${hint}`;
}
