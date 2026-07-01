#!/usr/bin/env bash
# arrfunds.com 发布 —— sites/ 纯数据站点：构建平台包与主题后用 matrix CLI 导出，
# rsync/Nginx/SSL 逻辑复用矩阵共享部署模板。
# 用法：从 sites/arrfunds/ 目录运行 ./deploy/deploy.sh
set -euo pipefail

export SITE_DOMAIN="arrfunds.com"
export DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"
export DEPLOY_DIR="${DEPLOY_DIR:-/var/www/arrfunds}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/../.." && pwd)"
SITE_NAME="$(basename "$SITE_DIR")"

# 平台包（blocks → site-kit → cli）与主题必须先构建为 dist/
(cd "$REPO_ROOT" && npm run build:platform && npm run build -w @matrix/theme-arrfunds)

export EXPORT_CMD="npm --prefix '$REPO_ROOT' run matrix -- export '$SITE_NAME'"

cd "$SITE_DIR"
source "$REPO_ROOT/packages/site-kit/deploy/deploy.template.sh"
