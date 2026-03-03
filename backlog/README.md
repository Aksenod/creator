# Backlog — Agent Protocol

## File Format

`tasks.json` contains all backlog tasks:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "abc123",
      "title": "Add dark mode",
      "description": "Implement dark theme support",
      "type": "feature",
      "status": "backlog",
      "priority": "medium",
      "screenshots": [],
      "createdAt": 1709500000000,
      "updatedAt": 1709500000000,
      "order": 0,
      "labels": ["ui", "theme"]
    }
  ]
}
```

## Agent Workflow

### Reading tasks
```bash
cat backlog/tasks.json | jq '.tasks[] | select(.status == "backlog")'
```

### Claiming a task
1. Read `backlog/tasks.json`
2. Find task with `status: "backlog"`
3. Update `status` to `"in_progress"`, set `updatedAt` to `Date.now()`
4. Write back to `backlog/tasks.json`

### Completing a task
1. Set `status` to `"done"`, update `updatedAt`
2. Write back to `backlog/tasks.json`

### API (dev server)
- `GET /api/backlog/tasks` — read all tasks
- `PUT /api/backlog/tasks` — write all tasks (full replace)
- `POST /api/backlog/screenshot?name=file.png` — upload screenshot (binary body)
- `GET /api/backlog/screenshot/:name` — serve screenshot file

## Screenshots

Screenshots are stored in `backlog/screenshots/` directory.
File names are sanitized to only contain `[a-zA-Z0-9._-]`.
