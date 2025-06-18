# Follow Plan MCP Server

A comprehensive Model Context Protocol (MCP) server for intelligent project planning and task management with SQLite persistence and full-text search capabilities.

## Features

- **Task Management**: Create, update, and track tasks with status, priority, and progress
- **Feature Planning**: Manage user stories, epics, and feature specifications
- **Bug Tracking**: Report and track bugs with severity levels and reproduction steps
- **Rule Engine**: Define project rules, validations, and automation guidelines
- **Full-Text Search**: Advanced search across all plan items with relevance scoring
- **SQLite Storage**: Persistent storage with FTS5 full-text search indexing
- **Auto-Sync**: Automatic synchronization between database and filesystem
- **Backup/Restore**: Database backup and restore functionality

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Start the MCP Server

```bash
npm start /path/to/your/project
```

The server will create a `.plan` directory in your project with the following structure:

```
.plan/
├── database.db          # SQLite database
├── index.md            # Project overview
├── tasks/              # Task files
├── features/           # Feature files
├── bugs/               # Bug files
├── rules/              # Rule files
├── workflows/          # Workflow documentation
├── changelog/          # Project changelog
└── tmp/                # Temporary files and logs
```

## MCP Tools

### Task Management

- `create_task` - Create a new task
- `update_task` - Update an existing task
- `get_task` - Get task details by ID
- `list_tasks` - List tasks with optional filters
- `delete_task` - Delete a task

### Feature Management

- `create_feature` - Create a new feature
- `update_feature` - Update an existing feature
- `get_feature` - Get feature details by ID
- `list_features` - List features with optional filters
- `delete_feature` - Delete a feature

### Bug Tracking

- `create_bug` - Create a new bug report
- `update_bug` - Update an existing bug
- `get_bug` - Get bug details by ID
- `list_bugs` - List bugs with optional filters
- `delete_bug` - Delete a bug

### Rule Management

- `create_rule` - Create a new project rule
- `update_rule` - Update an existing rule
- `get_rule` - Get rule details by ID
- `list_rules` - List rules with optional filters
- `delete_rule` - Delete a rule

### Search & Discovery

- `search` - Search across all plan items
- `advanced_search` - Advanced search with filters

### Data Management

- `backup_database` - Create a database backup
- `restore_database` - Restore from backup
- `sync_filesystem` - Sync database to filesystem

## MCP Resources

- `plan://index` - Project plan overview (Markdown)
- `plan://tasks` - All tasks (JSON)
- `plan://features` - All features (JSON)
- `plan://bugs` - All bugs (JSON)
- `plan://rules` - All rules (JSON)
- `plan://stats` - Project statistics (JSON)

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "follow-plan": {
      "command": "node",
      "args": [
        "/path/to/follow-plan-mcp/dist/index.js",
        "/path/to/your/project"
      ],
      "env": {}
    }
  }
}
```

### Environment Variables

- `LOG_LEVEL` - Set logging level (debug, info, warn, error)
- `PLAN_AUTO_SYNC` - Enable/disable auto-sync (default: true)
- `PLAN_BACKUP_INTERVAL` - Backup interval in seconds (default: 1800)

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
```

## Database Schema

The server uses SQLite with FTS5 full-text search. Key tables:

- `tasks` - Project tasks
- `features` - Feature specifications
- `bugs` - Bug reports
- `rules` - Project rules
- `messages` - Communication logs
- `prompts` - AI prompt templates
- `cascades` - Automation workflows
- `fts_search` - Full-text search index

## Architecture

```
src/
├── index.ts              # Main MCP server
├── types/                # TypeScript type definitions
├── services/             # Business logic services
│   ├── database-service.ts
│   ├── task-service.ts
│   ├── feature-service.ts
│   ├── bug-service.ts
│   ├── rule-service.ts
│   ├── search-service.ts
│   └── persistence-service.ts
├── handlers/             # MCP request handlers
│   ├── tools.ts
│   ├── resources.ts
│   ├── validation.ts
│   └── search-handlers.ts
├── utils/                # Utility functions
└── constants/            # Application constants
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: [Report a bug or request a feature]
- Documentation: See the `/docs` directory
- Examples: See the `/examples` directory

---

**Follow Plan MCP** - Intelligent project planning for the AI age 🚀
