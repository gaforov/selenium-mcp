# Changelog

All notable changes to this project are documented in this file.

## [0.1.1] - 2026-05-01

### Added

- Expanded tool surface for Selenium automation:
  - navigation aliases and page diagnostics (`navigate`, `get_current_url`, `get_title`, `get_page_source`)
  - discovery and reliability tools (`find_element`, `wait_for_element`, `wait_until_visible`, `retry_click`)
  - interaction utilities (`interact`, `press_key`, `upload_file`)
  - diagnostics and execution (`take_screenshot`, `execute_script`)
  - context management (`window`, `frame`, `alert`)
  - cookies (`add_cookie`, `get_cookies`, `delete_cookie`)
  - assertions (`assert_text`, `assert_visible`, `assert_attribute`)
- MCP resources:
  - `browser-status://current`
  - `accessibility://current`
- CI workflow for typecheck/build/test.
- Baseline automated tests for selector and tool-result helpers.
- Public package metadata improvements for npm/`npx` usage.

### Changed

- `start_browser` now accepts additional runtime options:
  - `browserArgs`
  - `pageLoadTimeoutMs`
  - `scriptTimeoutMs`
  - `windowSize`
- Documentation expanded for IntelliJ, VS Code, Cursor, Claude, Goose, and Windsurf setup.
- Package name updated to scoped publish target: `@gaforov/selenium-mcp`.

## [0.1.0] - 2026-04-26

### Added

- Initial public release of Selenium MCP server.
- Core browser lifecycle and interaction tools:
  - `start_browser`, `open_url`, `click`, `type`, `get_text`, `stop_browser`
- Strict TypeScript project setup with zod tool input validation.
- Explicit wait helpers for resilient element interactions.
- Modular architecture (`server`, `driver manager`, per-tool modules, shared helpers).
- Base documentation set and MIT license.
