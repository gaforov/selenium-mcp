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
- [ ] `resize_window` — resize the browser at runtime (currently only settable at `start_browser`)
- [ ] Extend waits with URL-contains / title-contains conditions

> **Note on tool count:** these are deliberately scoped to genuinely useful *primitives*.
> Larger servers reach 70+ tools by bundling opinionated subsystems (test recording,
> code generation, self-healing, risk analysis, Selenium Grid orchestration). This project
> favors clean composable primitives and lets the AI agent orchestrate higher-level
> workflows (see [USAGE_GUIDE.md](docs/USAGE_GUIDE.md)), rather than baking those workflows
> into fixed tools.

Also planned for this release:

- [ ] Improve tool-definition quality (Glama scores each tool on this): expand every tool's `description` to explain behavior + when to use it, and add `.describe()` to **every** zod input parameter. Lowest-scoring tools today: `interact`, `window`, `assert_visible`. No parameter currently has a `.describe()` annotation. Write descriptions that *steer* the agent between tools (e.g. "prefer X over screenshots for validation"), not just describe them.
- [ ] **End-to-end integration tests**: a reusable MCP test client (JSON-RPC over stdio, no mocking), local HTML fixtures loaded via `file://`, tests grouped by feature, run headless in CI. Verify outcomes, not absence of errors.
- [ ] **Automated npm publish**: GitHub Actions workflow that publishes on GitHub release using an npm granular automation token (`NPM_TOKEN` secret) — removes the interactive 2FA step from every release.
- [ ] **AGENTS.md**: agent-facing contributor doc (file map, conventions, add-a-tool checklist, testing philosophy) so AI coding assistants can contribute correctly.
- [ ] Reconsider `clear_field`: instead of a new tool, make `type` clear-the-field-first by default (with an `append` option) — one less tool, matches user expectation.
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
