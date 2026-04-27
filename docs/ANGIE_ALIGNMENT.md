# Angie Alignment Notes

Reference repo: https://github.com/angiejones/mcp-selenium

Goal: build an improved, cleaner, and more modular Selenium MCP server while preserving practical tool coverage.

## Primary strategy

- Angie repo is a market reference, not a design template.
- We optimize for maintainability, reliability, and MCP usability first.
- We only borrow ideas when they improve this architecture.
- Feature parity is optional; product quality is mandatory.

## Current parity snapshot

Implemented in this project:

- start_browser
- open_url (equivalent intent to navigate)
- click
- type (equivalent intent to send_keys)
- get_text (equivalent intent to get_element_text)
- stop_browser (equivalent intent to close_session)

## Angie feature areas not yet implemented here

High-priority parity features:

- get_element_attribute
- execute_script
- take_screenshot
- window management
- frame management
- alert handling
- upload_file
- cookie tools (add/get/delete)

Reliability and observability features:

- diagnostics (console/errors/network via BiDi when available)
- browser-status resource
- accessibility resource

## Naming strategy decision

Current project uses concise names:

- open_url, click, type, get_text, stop_browser

Angie-style names are more Selenium-centric:

- navigate, interact, send_keys, get_element_text, close_session

Recommendation for improved server:

- Keep current concise names as primary.
- Add Angie-compatible aliases where valuable for interoperability.
- Document aliases clearly to reduce AI confusion.

## Architectural improvements over Angie monolith

This project should keep these improvements:

- modular tools per file
- shared selector and wait utilities
- strict typing and zod boundaries
- consistent structuredContent responses
- predictable error payloads with selector and timeout context

## Implementation order from this point

1. Day 3 reliability

- wait_for_element
- wait_until_visible
- retry_click

2. Day 4 assertions

- assert_text
- assert_visible
- assert_attribute

3. Day 5 core parity additions

- get_element_attribute
- execute_script
- take_screenshot
- get_current_url
- get_title

4. Day 6 platform controls

- window
- frame
- alert
- upload_file

5. Day 7 diagnostics/resources

- diagnostics
- browser-status resource
- accessibility resource

## Decision log

- No full code copy from Angie repo.
- Use selective feature-level inspiration only.
- Preserve this project's modular architecture as the main differentiator.
- Prioritize best-practice implementation over matching external tool names or layout.
