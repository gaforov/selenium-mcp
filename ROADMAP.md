# Roadmap

Planned work for upcoming releases. Contributions toward any of these are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Shipped work is recorded in
[CHANGELOG.md](CHANGELOG.md).

## v0.3.1 (next)

- [ ] Demo video at the top of the README, recorded against saucedemo.com: `capture_page` refs,
      a login through those refs, `selector_hint_save`, assertions, then a `batch_execute` re-run
      to show the speed
- [ ] Fixes from the first round of 0.3.0 feedback
- [ ] Harden publishing: once trusted publishing has worked for a release, set the npm package's
      publishing access to "require two-factor authentication and disallow tokens"

## v0.4.0 (planned)

- [ ] Element screenshot: capture one element instead of the whole viewport, as a `selector`/`ref`
      parameter on `take_screenshot` rather than a new tool
- [ ] `drag_and_drop` — sliders, kanban boards, drop zones
- [ ] Console logs — surface the page's JavaScript errors to the agent, ideally captured
      automatically through WebDriver BiDi
- [ ] More `batch_execute` steps: `scroll` and `history`

## Scope

New tools are deliberately limited to genuinely useful *primitives*; see the questions in
[AGENTS.md](AGENTS.md) before proposing one. Larger servers reach 70+ tools by bundling
opinionated subsystems (test recording, code generation, self-healing, risk analysis, Selenium
Grid orchestration). This project favors clean, composable primitives and lets the AI agent
orchestrate higher-level workflows (see [USAGE_GUIDE.md](docs/USAGE_GUIDE.md)).

## Release checklist (every version)

1. Date the `## [x.y.z]` section in `CHANGELOG.md` (replace "Unreleased"). The Release workflow refuses to publish without it and uses the section as the GitHub Release body
2. Bump the version in `package.json` and in **both** version fields of `server.json`
3. Update the tool count in `README.md` (intro + "Tools (N)" heading), `package.json` description, and `server.json` description
4. Refresh the "What's new" section near the top of `README.md` (replace it each release; `CHANGELOG.md` keeps the history)
5. Optional local check: `node scripts/check-release.mjs vX.Y.Z`
6. Push `main` and the `vX.Y.Z` tag. The Release workflow runs every test, publishes to npm (trusted publishing, with provenance) and to the MCP Registry (GitHub OIDC), then creates the GitHub Release
7. Update the GitHub "About" description and mcp.so listing if the tool count changed
8. Move shipped items out of this file and make sure the next version's plan is written down

If the workflow fails after npm has published, fix the cause and re-run it: the npm and MCP
Registry steps skip a version that is already published. Manual fallback: `npm publish --access
public` in your own terminal, then `mcp-publisher login github` and `mcp-publisher publish`.

## Ideas / backlog

- Network inspection through WebDriver BiDi
- Selenium Grid support for remote and parallel execution
- Safari support
- A Dockerfile and `smithery.yaml` for more MCP directory listings
- Per-tool examples in `docs/TOOL_REFERENCE.md`
