# Filesystem Access Guidelines

## External Project Access

When working with projects outside the current workspace, use the filesystem MCP server tools instead of the standard workspace file tools.

### Key Rules

- If a path shows the project is outside the workspace (e.g., `/Users/username/projects/external-project`), use `mcp_filesystem_*` tools
- Standard file tools (`readFile`, `listDirectory`, etc.) are restricted to the workspace
- MCP filesystem tools can access external directories and files

### Available MCP Filesystem Tools

- `mcp_filesystem_list_directory` - List directory contents
- `mcp_filesystem_read_text_file` - Read text files
- `mcp_filesystem_read_multiple_files` - Read multiple files at once
- `mcp_filesystem_directory_tree` - Get recursive directory structure
- `mcp_filesystem_get_file_info` - Get file metadata

### Usage Pattern

1. Use `mcp_filesystem_list_directory` or `mcp_filesystem_directory_tree` to explore structure
2. Use `mcp_filesystem_read_text_file` to examine individual files
3. Copy relevant content into workspace using standard tools (`fsWrite`, etc.)