#!/usr/bin/env bash
# silkline.id 发布 — sites/ 纯数据站点
set -euo pipefail

export SITE_DOMAIN="silkline.id"
export DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/../.." && pwd)"
SITE_NAME="$(basename "$SITE_DIR")"

(cd "$REPO_ROOT" && npm run build:platform && npm run build -w @matrix/theme-arrfunds)

export EXPORT_CMD="npm --prefix '$REPO_ROOT' run matrix -- export '$SITE_NAME'"

cd "$SITE_DIR"
source "$REPO_ROOT/packages/site-kit/deploy/deploy.template.sh"
