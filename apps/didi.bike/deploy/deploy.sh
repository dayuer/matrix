#!/usr/bin/env bash
# didi.bike 发布 —— 逻辑复用矩阵共享部署模板，本文件仅声明站点参数。
# 用法：从 apps/didi.bike/ 目录运行 ./deploy/deploy.sh
set -euo pipefail

export SITE_DOMAIN="didi.bike"
export DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../../../packages/site-kit/deploy/deploy.template.sh"
