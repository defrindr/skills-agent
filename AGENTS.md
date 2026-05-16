# Skills Repository

This workspace is a collection of **AI agent skills** — reusable, on-demand workflows that AI coding agents load when a matching task is triggered.

## Structure

```
{category}/{skill-name}/SKILL.md
```

| Category | Path | Purpose |
|---|---|---|
| Common | `common/project-readability/` | Master readability guide — all other skills defer to this |
| Backend | `backend/expressjs-readability/` | Express.js + Node.js readability rules |
| Backend | `backend/fastapi-readability/` | FastAPI (Python) readability rules |
| Backend | `backend/golang-readability/` | Go (Gin / Fiber / Echo) readability rules |
| Backend | `backend/laravel-readability/` | Laravel-specific readability rules |
| Backend | `backend/nestjs-readability/` | NestJS-specific readability rules |
| Frontend | `frontend/nextjs-readability/` | Next.js readability rules |
| Frontend | `frontend/react-readability/` | React + Vite readability rules |
| Frontend | `frontend/vue-nuxt-svelte-readability/` | Vue / Nuxt / Svelte readability rules |
| Mobile | `mobile/flutter-readability/` | Flutter + Riverpod readability rules |
| Mobile | `mobile/react-native-readability/` | React Native / Expo readability rules |

## Conventions

- All skills are written in **Bahasa Indonesia**.
- `common/project-readability/` is the canonical source of truth. Framework skills extend it; when there is a conflict, readability always wins.
- Every `SKILL.md` must have a YAML frontmatter block with:
  - `name`: matches the folder name (e.g. `laravel-readability`)
  - `description`: a multi-line block listing trigger phrases and use cases — this is how the agent decides when to load the skill. Include keywords such as "setup", "init", "code review", "refactor", and any framework-specific terms.

## Adding a New Skill

1. Create `{category}/{skill-name}/SKILL.md`.
2. Add frontmatter: `name`, `description` with rich trigger phrases.
3. Open with a one-paragraph goal statement.
4. Reference `project-readability` as the authority for naming, folder structure, and boring-code preference.
5. Add framework-specific sections: folder structure, API contracts, testing conventions, Docker setup.
