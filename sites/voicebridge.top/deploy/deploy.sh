#!/usr/bin/env bash
# voicebridge.top 发布 — sites/ 纯静态页面同步发布
set -euo pipefail

export SITE_DOMAIN="voicebridge.top"
export DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/../.." && pwd)"
SITE_NAME="$(basename "$SITE_DIR")"

# 静态渲染导出：把本站点根目录下的所有 HTML 和相关的 png/svg/xml/txt 静态资产拷贝到 out/ 进行发布
export EXPORT_CMD="mkdir -p '$SITE_DIR/out' && rm -rf '$SITE_DIR/out/'* && cp '$SITE_DIR/'*.html '$SITE_DIR/out/' && cp -f '$SITE_DIR/'*.{png,svg,xml,txt} '$SITE_DIR/out/' 2>/dev/null || true"

cd "$SITE_DIR"
source "$REPO_ROOT/packages/site-kit/deploy/deploy.template.sh"
