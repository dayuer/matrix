#!/usr/bin/env bash
# ============================================================
#  edaijia (busae.ai) Static Site Deploy Script
#  Run from apps/edaijia/ directory
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# Default fallback values
DEPLOY_SERVER="root@43.156.128.95"
DEPLOY_DIR="/var/www/busae.ai"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=.env.deploy
  source "$ENV_FILE"
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
fail() { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ---------- 1. Build & Export ----------
log "构建站点依赖的主题包..."
source "$SCRIPT_DIR/../../../packages/site-kit/deploy/build-themes.sh"
log "Compiling Express templates and static rendering..."
npm run build
npm run export

# ---------- 2. Push static assets via RSync ----------
log "Syncing static out/ directory to remote VPS: $DEPLOY_SERVER:$DEPLOY_DIR"
ssh "$DEPLOY_SERVER" "mkdir -p $DEPLOY_DIR"
rsync -avz --delete -e ssh out/ "$DEPLOY_SERVER:$DEPLOY_DIR/"

log "Aligning web files ownership..."
ssh "$DEPLOY_SERVER" "chown -R www-data:www-data $DEPLOY_DIR"

log "Testing Nginx and reloading config..."
ssh "$DEPLOY_SERVER" "nginx -t && systemctl reload nginx"

log "Deployment complete! 🚀 https://busae.ai"
