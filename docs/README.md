# Documentation Index

This folder contains the authoritative documentation for selenium-mcp.

## Start here

- TOOL_REFERENCE.md: Current tool contracts and examples
- ARCHITECTURE.md: Code structure and runtime flow
- CLIENT_INTEGRATION.md: Using this MCP server from hosts, including IntelliJ workflows
- INTELLIJ_USAGE.md: Step-by-step guide to setting up and using selenium-mcp in IntelliJ IDEA
- DEVELOPMENT.md: Local development and contribution workflow

## Current implementation status

Implemented tools:

- start_browser
- open_url
- navigate
- find_element
- wait_for_element
- wait_until_visible
- click
- retry_click
- interact
- type
- get_text
- get_attribute
- assert_text
- assert_visible
- assert_attribute
- press_key
- take_screenshot
- get_current_url
- get_title
- get_page_source
- execute_script
- upload_file
- window
- frame
- alert
- add_cookie
- get_cookies
- delete_cookie
- stop_browser

Implemented resources:

- browser-status://current
- accessibility://current

Planned next additions include assertions, richer diagnostics, and optional multi-session support.
