# Private Repository Installation Guide

Since the repository is private, installation requires GitHub authentication.

---

## Prerequisites

1. **Node.js 18+** - https://nodejs.org
2. **npm 9+** - Comes with Node.js
3. **git** - https://git-scm.com
4. **GitHub Authentication** - One of:
   - GitHub CLI (`gh`) - Recommended
   - SSH Key configured
   - HTTPS credentials

---

## Authentication Setup

### Option 1: GitHub CLI (Recommended)

```bash
# Install gh CLI
brew install gh  # macOS
# or: https://cli.github.com/

# Authenticate
gh auth login

# Verify
gh auth status
```

### Option 2: SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys

# Verify
ssh -T git@github.com
```

### Option 3: HTTPS Token

```bash
# Create token: https://github.com/settings/tokens
# Select scopes: repo (full)

# Configure git credential helper
git config --global credential.helper store

# On first clone, enter:
# Username: your-github-username
# Password: ghp_your_token_here
```

---

## Installation

### Quick Install (if authenticated)

```bash
bash <(curl -fsSL https://gist.githubusercontent.com/defrindr/YOUR-GIST-ID/raw/install.sh)
```

**Or manual steps:**

```bash
# Clone repository
gh repo clone defrindr/skills-agent ~/.skills-agent
# OR: git clone git@github.com:defrindr/skills-agent.git ~/.skills-agent
# OR: git clone https://github.com/defrindr/skills-agent.git ~/.skills-agent

# Navigate to package
cd ~/.skills-agent/skills-agent

# Install & build
npm install
npm run build

# Run setup
npm run setup
```

---

## Verification

```bash
# Check installation
ls -la ~/.skills-agent/skills-agent

# Check skills linked
ls -la ~/.agents/skills/

# Check OpenCode config
cat ~/.config/opencode/opencode.json

# Verify in OpenCode
opencode mcp list
# Should show: ● ✓ skills-agent connected
```

---

## Uninstall

```bash
bash ~/.skills-agent/skills-agent/uninstall.sh
```

---

## Troubleshooting

### "Authentication failed"

**Solution:** Configure one of the auth methods above (gh CLI, SSH, or HTTPS token)

### "Permission denied (publickey)"

**Solution:** Add SSH key to GitHub account
```bash
cat ~/.ssh/id_ed25519.pub
# Copy and add: https://github.com/settings/keys
```

### "Could not resolve host: github.com"

**Solution:** Check internet connection or DNS settings

### "fatal: could not read Username"

**Solution:** Use gh CLI or configure HTTPS token:
```bash
gh auth login
```

### Skills not appearing in OpenCode

**Solution:** Restart OpenCode (Quit + reopen), then check:
```bash
opencode mcp list
```

---

## Update

```bash
cd ~/.skills-agent/skills-agent
git pull
npm install
npm run build
npm run setup
```

---

## Alternative: Make Repo Public

If you want public installation (no auth required):

1. Go to: https://github.com/defrindr/skills-agent/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Make public"
4. Confirm

Then install works without authentication:
```bash
curl -fsSL https://github.com/defrindr/skills-agent/releases/latest/download/install.sh | bash
```

---

## For Contributors

### Local Development

```bash
git clone git@github.com:defrindr/skills-agent.git
cd skills-agent/skills-agent
npm install
npm run build
npm run setup
```

### Create Release

```bash
# Test locally
bash scripts/prepare-release.sh v0.1.0

# Create tag
git tag -a v0.1.0 -m "Release v0.1.0"

# Push tag (triggers CI/CD)
git push origin v0.1.0
```

Note: GitHub Releases from private repos have private assets. Users still need authentication.

---

## Summary

**Private Repo:**
- ✅ Source code protected
- ❌ Requires GitHub auth for install
- ✅ Good for internal/team use

**Public Repo:**
- ✅ No auth required
- ✅ Easy distribution
- ❌ Source code public

Choose based on your needs!
