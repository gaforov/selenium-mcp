# selenium-mcp Copilot Instructions

## Session startup rules

- Read docs/README.md first for documentation map and scope.
- Read docs/STATE.md next to get current implementation status.
- Read docs/ROADMAP.md next to align with milestone sequencing.
- Continue from the next unfinished roadmap day unless the user explicitly changes priority.

## Architecture rules

- Keep one concern per tool module in src/tools.
- Keep WebDriver lifecycle logic in src/driver/driverManager.ts.
- Keep server bootstrap and signal handling in src/server.ts only.
- Validate all tool inputs with zod schemas.
- Return MCP responses using helpers in src/utils/toolResult.ts.
- Use strict TypeScript and avoid any.
- Treat external repos as references only; do not mirror their structure by default.
- Prefer clear abstractions and reliability over mirroring external project structure.

## Reliability rules

- Prefer explicit waits over sleeps.
- Include structuredContent in tool responses when useful to downstream AI clients.
- Provide actionable error messages with context (selector, timeout, URL) for new tools.

## Workflow rules

- Before ending a session, update docs/STATE.md with completed work and next actions.
- Keep docs/ROADMAP.md milestone-based and stable; only update when strategy changes.
