#!/usr/bin/env bash
# voicebridge.top 发布 — sites/ 纯静态页面同步发布
set -euo pipefail

export SITE_DOMAIN="voicebridge.top"
export DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/../.." && pwd)"
SITE_NAME="$(basename "$SITE_DIR")"

# 静态渲染导出：仅把 translate/docs 的所有 HTML 文件拷贝到 sites/voicebridge.top/out/，排除内部 Markdown 文档
export EXPORT_CMD="mkdir -p '$SITE_DIR/out' && rm -rf '$SITE_DIR/out/'* && cp '$REPO_ROOT/../translate/docs/'*.html '$SITE_DIR/out/'"

cd "$SITE_DIR"
source "$REPO_ROOT/packages/site-kit/deploy/deploy.template.sh"
