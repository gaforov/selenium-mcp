# Contributing to selenium-mcp

Contributions are welcome — bug reports, feature requests, documentation fixes, and pull requests.

## Getting started

```bash
git clone https://github.com/gaforov/selenium-mcp.git
cd selenium-mcp
npm install
npm run build
npm test
```

Requirements: Node.js 20+ and Chrome, Firefox, or Edge installed.

## Development workflow

1. Fork the repository and create a branch from `main`.
2. Make your change. Keep the style of the surrounding code: strict TypeScript, zod validation for all tool inputs, structured responses via the shared helpers.
3. Run the checks locally:
   ```bash
   npm run typecheck
   npm test
   ```
4. Open a pull request against `main` with a short description of what changed and why.

## Adding a new tool

- Create `src/tools/<toolName>.ts` following the pattern of an existing tool (e.g. `src/tools/click.ts`).
- Validate inputs with zod and return structured results via the shared result helpers.
- Register it in `src/tools/index.ts` and add its name to `CORE_TOOL_NAMES`.
- Document it in `docs/TOOL_REFERENCE.md`.
- Add or extend a test in `test/`.

## Reporting bugs

Open an issue at https://github.com/gaforov/selenium-mcp/issues with:

- What you did (tool call and arguments, MCP client used)
- What you expected and what happened instead
- OS, Node.js version, and browser/driver versions
- If possible, a trace: run with `SELENIUM_MCP_TRACE=true` and attach the relevant NDJSON lines

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
