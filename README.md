# Follow Plan MCP Server

A Model Context Protocol (MCP) server for AI implementation plan tracking and context management.

## Installation

```bash
npm install -g follow-plan-mcp
```

## Usage

```bash
follow-plan-mcp /path/to/your/project
```

## Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "follow-plan": {
      "command": "npx",
      "args": ["-y", "follow-plan-mcp", "/path/to/project"]
    }
  }
}
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
