# Roadmap

Planned work for upcoming releases. Contributions toward any of these are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## v0.3.0 (planned)

New tools (each follows the existing per-tool module pattern, e.g. `src/tools/click.ts`):

- [ ] `select_option` — dropdown (`<select>`) handling via Selenium's Select API
- [ ] `scroll` — scroll by offset or scroll an element into view (lazy-loaded content, long pages)
- [ ] `back` / `forward` / `refresh` — browser history navigation
- [ ] `clear_field` — clear an input before retyping

Consolidate duplicate tools (breaking change — cheap now at low adoption; note in CHANGELOG):

- [ ] Remove `open_url` — byte-for-byte duplicate of `navigate` (both call `driver.get(url)`). Keep `navigate` (industry-standard name).
- [ ] Remove `wait_until_visible` — equivalent to `wait_for_element` with `visible: true`. Keep `wait_for_element` (strictly more capable).
- [ ] Keep `find_element` — borderline but returns element text/metadata that `wait_for_element` doesn't; sharpen its description to say how it differs.

Stretch goals:

- [ ] `drag_and_drop` — sliders, kanban boards, drop zones
- [ ] `get_console_logs` — surface JS console errors to the agent
- [ ] Element-level screenshot (capture one element instead of the viewport)

Also planned for this release:

- [ ] Improve tool-definition quality (Glama scores each tool on this): expand every tool's `description` to explain behavior + when to use it, and add `.describe()` to **every** zod input parameter. Lowest-scoring tools today: `interact`, `window`, `assert_visible`. No parameter currently has a `.describe()` annotation.
- [ ] Add `glama.json` to the repo root (Glama profile metadata; currently flagged missing)
- [ ] Demo video at the top of the README (recorded against saucedemo.com, showcasing `capture_page` refs, selector hints, and `batch_execute`)

## Release checklist (every version)

1. Add a `## [x.y.z] - date` section to `CHANGELOG.md` (the release workflow uses it as the GitHub Release body)
2. Bump the version in `package.json` and in **both** version fields of `server.json`
3. Update the tool count in `README.md` (intro + "Tools (N)" heading), `package.json` description, and `server.json` description
4. `npm publish --access public` (interactive terminal — 2FA)
5. Re-publish to the MCP Registry: `mcp-publisher login github`, then `mcp-publisher publish`
6. Push `main` and the `vX.Y.Z` tag
7. Update the GitHub "About" description and mcp.so listing if the tool count changed

## Ideas / backlog

- BiDi-based capabilities (network inspection, console capture without polling)
- Selenium Grid support for remote/parallel execution
- Per-tool docs examples in `docs/TOOL_REFERENCE.md`
