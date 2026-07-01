#!/usr/bin/env bash
# ============================================================
#  内容矩阵 · 主题包构建助手
#  用法：从 app 目录（cwd = apps/<site>/）source 本文件，不要单独执行。
#  作用：读取当前目录 package.json 里所有 @matrix/theme-* 依赖，逐个执行
#        `npm run build -w <theme>`，确保 theme.dir/dist、theme.dir/public
#        在导出/发布前是最新的。表现层已收敛进主题包后，app 自身不再有
#        client 代码需要单独编译——真正要编译的是这里。
# ============================================================

THEMES="$(grep -oE '"@matrix/theme-[a-zA-Z0-9_-]+"' package.json | tr -d '"' | sort -u || true)"

if [[ -z "$THEMES" ]]; then
  echo "[deploy] 未在 package.json 中发现 @matrix/theme-* 依赖，跳过主题构建"
else
  for t in $THEMES; do
    echo "[deploy] 构建主题包 $t ..."
    npm run build -w "$t"
  done
fi
