# Follow Plan MCP API

## Tools

### create_task
Creates a new task in the project plan.

**Parameters:**
- `title` (string, required): Task title
- `description` (string, required): Task description  
- `priority` (string, optional): Task priority (low|medium|high|critical)

### update_task_status
Updates the status of an existing task.

**Parameters:**
- `taskId` (string, required): Task ID
- `status` (string, required): New status (todo|in-progress|done|blocked)

## Resources

The server exposes all plan files as resources with `file://` URIs.
