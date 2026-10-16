# SuperStudent Archive Platform

## Prerequisites
- **Node.js**: `>= 22.18.0` (declared in `.nvmrc` and `package.json`)
- **Package Manager**: `pnpm` (configured via `pnpm-workspace.yaml` and `pnpm-lock.yaml`)

## Quick Setup
```bash
# Enable pnpm via Corepack
corepack enable
corepack prepare pnpm@latest --activate

# Install dependencies with frozen lockfile
pnpm install --frozen-lockfile

# Build monorepo & worker frontend
pnpm run build:worker
```

## Cloudflare Deployment Settings
- **Root Directory**: `/`
- **Node Version**: `22.18.0` (`NODE_VERSION = 22.18.0`)
- **Install Command**:
  ```bash
  corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile
  ```
- **Build Command**:
  ```bash
  pnpm run build:worker
  ```
- **Output Directory**:
  ```text
  artifacts/superstudent/dist/public
  ```
