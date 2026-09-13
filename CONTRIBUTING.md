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
   npm run test:e2e   # end-to-end tests in headless Chrome
   ```
4. Open a pull request against `main` with a short description of what changed and why.

## Adding a new tool

Read [AGENTS.md](AGENTS.md) first. It has the questions to answer before adding a tool, the full
checklist (registration, descriptions for the tool and every parameter, an end-to-end test, and
the docs to update), and the conventions every tool follows. It is written for AI coding
assistants, and works just as well for people.

## Reporting bugs

Open an issue at https://github.com/gaforov/selenium-mcp/issues with:

- What you did (tool call and arguments, MCP client used)
- What you expected and what happened instead
- OS, Node.js version, and browser/driver versions
- If possible, a trace: run with `SELENIUM_MCP_TRACE=true` and attach the relevant NDJSON lines

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
