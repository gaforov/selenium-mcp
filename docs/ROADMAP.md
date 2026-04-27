# Selenium MCP Roadmap

This plan is designed to continue across multiple chat sessions.

## Day 1 (completed in this session)

- Initialize TypeScript project and scripts
- Build MCP stdio server
- Add driver lifecycle manager
- Implement tools:
  - start_browser
  - open_url
  - stop_browser
- Add graceful shutdown
- Add continuity docs (this file + STATE)

## Day 2 (completed)

- Add selector contract for element tools
- Implement click and type
- Implement get_text
- Add explicit wait utilities
- Establish baseline public documentation set

## Day 3

- Implement wait_for_element and wait_until_visible
- Add retry_click for transient UI failures
- Add enriched error payloads with selector + timeout context

## Day 4

- Implement assertions:
  - assert_text
  - assert_visible
  - assert_attribute
- Standardize assertion failure messaging for LLM readability

## Day 5

- Add diagnostics:
  - capture_screenshot
  - get_page_source
  - get_current_url
  - get_title
- Add server health/status tool

## Day 6

- Add tests:
  - unit tests for schema + result formatting
  - integration smoke tests for tool contracts
- Add lint and CI workflow

## Day 7+

- Session map support (multi-session browser control)
- Optional Playwright parity tools
- Optional API and DB validation helpers
- Optional visual regression pipeline

## Non-negotiable architecture rules

- Keep one concern per tool module
- Keep Selenium calls out of server bootstrap code
- Validate at MCP tool boundaries with zod
- Return consistent content + structuredContent
- Prefer explicit waits over hard sleeps
