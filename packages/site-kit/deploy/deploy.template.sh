#!/usr/bin/env bash
# ============================================================
#  内容矩阵 · 通用静态站点部署模板（含 SSL 引导）
#  用法：在 app 目录下创建 deploy/deploy.sh，内容为：
#     #!/usr/bin/env bash
#     export SITE_DOMAIN="synon.ai"
#     export DEPLOY_SERVER="root@43.156.128.95"   # 可用环境变量覆盖
#     source "$(git rev-parse --show-toplevel)/packages/site-kit/deploy/deploy.template.sh"
#  这样所有站点共用同一套发布逻辑，只需声明域名。
# ============================================================

set -euo pipefail

: "${SITE_DOMAIN:?必须设置 SITE_DOMAIN，例如 synon.ai}"
DEPLOY_SERVER="${DEPLOY_SERVER:-root@43.156.128.95}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/${SITE_DOMAIN}}"
CERT_EMAIL="${CERT_EMAIL:-contact@${SITE_DOMAIN}}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
fail() { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ---------- 1. Build & Export ----------
# 两种站点形态：
#   apps/  TS 工程站点（默认路径）：构建主题包后在站点目录 npm run export
#   sites/ 纯数据站点：deploy.sh 设 EXPORT_CMD（通常为 matrix CLI 导出），跳过 app 专属构建
if [ -n "${EXPORT_CMD:-}" ]; then
  log "静态渲染导出（EXPORT_CMD）: $EXPORT_CMD"
  eval "$EXPORT_CMD"
else
  log "构建站点依赖的主题包..."
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/build-themes.sh"
  log "静态渲染导出..."
  npm run export
fi

# ---------- 2. Push static assets ----------
log "同步 out/ 到远端: $DEPLOY_SERVER:$DEPLOY_DIR"
ssh "$DEPLOY_SERVER" "mkdir -p $DEPLOY_DIR"
rsync -avz --delete -e ssh out/ "$DEPLOY_SERVER:$DEPLOY_DIR/"

# ---------- 3. Nginx + SSL ----------
log "检查 $SITE_DOMAIN 的 SSL 证书..."
if ssh "$DEPLOY_SERVER" "[ -f /etc/letsencrypt/live/${SITE_DOMAIN}/fullchain.pem ]"; then
    log "证书已存在，部署 HTTPS Nginx 配置..."
    scp deploy/nginx.conf "$DEPLOY_SERVER:/etc/nginx/sites-available/${SITE_DOMAIN}"
    ssh "$DEPLOY_SERVER" "ln -sf /etc/nginx/sites-available/${SITE_DOMAIN} /etc/nginx/sites-enabled/${SITE_DOMAIN}"
else
    warn "未找到证书，开始 Let's Encrypt 引导..."
    ssh "$DEPLOY_SERVER" "cat > /etc/nginx/sites-available/${SITE_DOMAIN}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SITE_DOMAIN} www.${SITE_DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { root ${DEPLOY_DIR}; index index.html; }
}
EOF
    ssh "$DEPLOY_SERVER" "ln -sf /etc/nginx/sites-available/${SITE_DOMAIN} /etc/nginx/sites-enabled/${SITE_DOMAIN}"
    ssh "$DEPLOY_SERVER" "mkdir -p /var/www/certbot && nginx -t && systemctl reload nginx"
    log "申请证书..."
    ssh "$DEPLOY_SERVER" "certbot certonly --webroot -w /var/www/certbot -d ${SITE_DOMAIN} -d www.${SITE_DOMAIN} --non-interactive --agree-tos --email ${CERT_EMAIL}"
    log "应用最终 HTTPS 配置..."
    scp deploy/nginx.conf "$DEPLOY_SERVER:/etc/nginx/sites-available/${SITE_DOMAIN}"
fi

log "对齐属主并重载 Nginx..."
ssh "$DEPLOY_SERVER" "chown -R www-data:www-data $DEPLOY_DIR && nginx -t && systemctl reload nginx"
log "部署完成! 🚀 https://${SITE_DOMAIN}"
