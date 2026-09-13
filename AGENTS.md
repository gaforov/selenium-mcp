# AGENTS.md

Guidance for AI coding assistants (and humans) changing this repository. For end-user docs,
see [README.md](README.md) and [docs/](docs/README.md).

## What this is

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes Selenium
WebDriver to AI agents over stdio. TypeScript (strict, ESM), Node.js 20+,
`@modelcontextprotocol/sdk` (`McpServer.registerTool`), and zod v4 (import from `"zod/v4"`).

## Commands

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # compile to dist/
npm test            # build + unit tests (test/*.test.mjs), no browser needed
npm run test:e2e    # build + end-to-end tests in headless Chrome (Chrome must be installed)
npm run dev         # run the server from source with tsx
```

Tests import from `dist/`, so they always build first. Run all three checks before finishing:
`npm run typecheck && npm test && npm run test:e2e`.

## File map

| Path | What lives there |
|---|---|
| `src/server.ts` | Entry point: CLI flags (`--help`, `--version`, `--list-tools`), stdio transport, shutdown. The version comes from `package.json` at runtime. |
| `src/driver/driverManager.ts` | Browser sessions (single and multi-session) and which one is active. |
| `src/tools/index.ts` | Registers every tool. `CORE_TOOL_NAMES` must list exactly the registered tools; an E2E test fails if they drift. |
| `src/tools/<tool>.ts` | One file per tool, or per tight family (`assertions`, `cookies`, `session`, `selectorHints`). |
| `src/tools/shared/` | Reusable pieces: `selector.ts` (selector schema, `timeoutMs`), `targetSelector.ts` (selector-or-ref), `waits.ts`, `pageRefs.ts` (`capture_page` refs), `selectorHints.ts` (hint storage), and logic shared with `batch_execute` (`selectOption.ts`, `pageWaits.ts`). |
| `src/resources/index.ts` | MCP resources `browser-status://current` and `accessibility://current`. |
| `src/utils/` | `toolResult.ts` (`textResult`, `errorResult`, `toErrorMessage`) and optional tracing. |
| `test/*.test.mjs` | Unit tests, including `toolDescriptions.test.mjs`. |
| `test/e2e/` | End-to-end tests grouped by feature; `helpers/harness.mjs` provides `useBrowserSession()`. |
| `test/fixtures/` | Local HTML pages the E2E tests drive, served over HTTP. |

## Before adding a tool

A smaller set of well-described tools beats a long list: every tool costs context in each AI
request and adds a choice the agent can get wrong. Answer these first:

1. **Can it be a parameter or action on an existing tool?** Runtime resizing became `window`
   actions `resize`/`maximize`; back, forward, and refresh became one `history` tool.
2. **Would an AI realistically call it** during a real session?
3. **Can `execute_script` already do it** well enough?
4. **Is it a primitive?** Don't bake workflows (test recording, code generation, self-healing)
   into tools. The agent composes primitives into workflows.

If the answer to 1 or 3 is yes, or to 2 is no, don't add a tool.

## Adding a tool: checklist

1. Create `src/tools/<toolName>.ts` following an existing tool, e.g. `src/tools/selectOption.ts`.
   Put logic that another tool (such as `batch_execute`) also needs into `src/tools/shared/`.
2. Register it in `src/tools/index.ts` and add its name to `CORE_TOOL_NAMES`.
3. Write full descriptions (see below).
4. If it is a simple, linear action, consider offering it as a `batch_execute` step too.
5. Add an E2E test in `test/e2e/<feature>.test.mjs`, with a fixture page in `test/fixtures/`.
6. Update the docs: the tools table in `README.md`, the list in `docs/README.md`,
   `docs/TOOL_REFERENCE.md`, the table in `docs/USAGE_GUIDE.md`, the next-version section of
   `CHANGELOG.md`, and `ROADMAP.md` if the item was planned.
7. Run `npm run typecheck && npm test && npm run test:e2e`.

## Tool conventions

- **Handlers never throw.** Wrap the body in `try/catch`; return `textResult(message, data)` on
  success and `errorResult(message, context)` on failure.
- **Errors say what to do next.** A good error lets the agent recover without guessing: list
  the available options, show the actual URL and title on a timeout, name the tool to use instead.
- **Accept `selector` or `ref`** for tools that act on one element: use
  `selectorOrRefInputSchema` and `resolveSelectorFromTarget`.
- **Wait, don't sleep.** Use the helpers in `shared/waits.ts` with the shared `timeoutMs`.
- **Log to stderr only.** stdout carries the MCP protocol.

## Descriptions are required

The tool `description` and each parameter's `.describe()` are what an AI reads to choose a tool
and fill in its arguments. `test/toolDescriptions.test.mjs` fails if any tool description is under
100 characters or any parameter lacks a description.

- **Tool description:** what it does, what it waits for, what it returns, when to use a similar
  tool instead (e.g. `click` vs `retry_click` vs `interact`), and any action that cannot be undone.
- **Parameters:** valid values, the default, and a concrete example.
- Shared schemas in `src/tools/shared/` already carry descriptions; override with `.describe()`
  when a tool gives them a more specific meaning.
- Keep examples free of backslash escapes, which are easy to double up: write `[0-9]`, not `\d`.

## Testing approach

- E2E tests go through the real MCP protocol over stdio and a real browser. No mocking.
- Verify outcomes, not the absence of errors: check that the page actually changed.
- Where possible, check page state independently (for example with an `execute_script` step in
  `batch_execute`) instead of trusting the tool's own report.
- Test the error paths and their messages, not only the happy path.
- Each `describe()` block gets its own server, browser, and fixture server via `useBrowserSession()`.

## Breaking changes and releases

- Removing or renaming a tool or parameter is a breaking change: use a `feat!:` commit and add a
  **Breaking** entry to `CHANGELOG.md` that names the replacement.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Releases follow the checklist in [ROADMAP.md](ROADMAP.md) and are published by the maintainer.
