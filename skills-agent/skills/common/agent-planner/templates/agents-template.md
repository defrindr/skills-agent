# Skills Agent Configuration

## Project Context
- **Name**: [project name]
- **Type**: [web-app / backend-api / fullstack / mobile]
- **Stack**: [framework + db + auth + ...]
- **Scale**: [mvp / startup / enterprise]
- **Created**: [YYYY-MM-DD]

## Active Skills

### Core
- `project-readability` - naming, structure, boring code
- `token-efficient-coding` - dense code, no fluff

### Framework
- `[framework]-readability`

### Database
- `database-designer`
- `database-optimizer`

### Quality
- `code-health`

## Workflows

### Implement Feature
Trigger: "implement [feature]", "add [feature]"

1. Load `feature-architect`
2. Read relevant flow dari `.opencode/flows/`
3. Load `[framework]-readability`
4. Load `database-designer` (kalau touch DB)
5. Load `code-health` setelah implementasi

### Code Review
Trigger: "review", "audit code"

1. Load `project-readability`
2. Load `[framework]-readability`
3. Load `code-health`

### Add New Flow
Trigger: "new flow", "design flow"

1. Pakai flow template dari agent-planner
2. Save ke `.opencode/flows/[name].md`
3. Update flow references di AGENTS.md ini
4. Then implement

## Flow References

- [Auth Flow](./flows/auth-flow.md)
- [...]

## MCP Servers

Lihat `.opencode/recommended-mcps.json`.

## Conventions

- API response: `{ data, error, meta }`
- Naming: camelCase frontend, snake_case backend → transform di API client
- Errors: throw `AppError`, handler di middleware

## Notes

[Project-specific gotchas]
