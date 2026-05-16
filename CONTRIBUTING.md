# Contributing to Skills Agent

Thanks for your interest! This project is in early development.

## 🚧 Current Status

**Pre-alpha** - Install via script, iterating quickly. npm publish coming later when stable.

## 🛠️ Development Setup

```bash
# Clone
git clone https://github.com/defrindr/skills-agent.git
cd skills-agent/skills-agent

# Install
npm install

# Build
npm run build

# Test setup
npm run setup
```

## 📝 Adding Skills

Skills are in `skills/{category}/{skill-name}/SKILL.md`.

### Format

```markdown
---
name: my-skill
description: |
  What this skill does.
  Trigger phrases: "init project", "setup app"
default_provider: deepseek
complexity: medium
---

# Skill Content in Bahasa Indonesia

Panduan lengkap untuk...
```

### Categories

- `common/` - Core, framework-agnostic
- `backend/` - Backend frameworks
- `frontend/` - Frontend frameworks
- `mobile/` - Mobile frameworks

### Guidelines

1. **Write in Bahasa Indonesia** - Skills content harus full Bahasa
2. **Reference project-readability** - Defer to master guideline
3. **Be specific** - Concrete examples > abstract rules
4. **Boring > Clever** - Predictable code preferred

## 🧪 Testing

```bash
# Build
npm run build

# Test setup script
npm run setup

# Verify skills linked
ls -la ~/.agents/skills/

# Test in OpenCode
opencode mcp list  # Should show skills-agent connected
```

## 📤 Submitting Changes

1. Fork repo
2. Create branch: `git checkout -b feature/my-skill`
3. Make changes
4. Test locally
5. Commit: `git commit -m "feat: add my-skill"`
6. Push: `git push origin feature/my-skill`
7. Open PR

## 🐛 Reporting Issues

Use GitHub Issues:
- Bug reports
- Feature requests
- Skill suggestions
- Documentation improvements

## 💬 Questions?

Open a GitHub Discussion or Issue.

---

**Early days** - Expect breaking changes. We'll stabilize before 1.0.
