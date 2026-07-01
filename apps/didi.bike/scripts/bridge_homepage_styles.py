import os

def main():
    didi_css_path = '../../themes/didi/theme.css'
    dossier_css_path = '../../themes/dossier/theme.css'
    
    # 1. 提取 didi 首页组件相关的 CSS (第 717 行到 1912 行，0-indexed 为 716 到 1912)
    with open(didi_css_path, 'r', encoding='utf-8') as f:
        didi_lines = f.readlines()
    
    # 717 是第 716 行，1912 是第 1911 行
    homepage_css = "".join(didi_lines[716:1912])
    
    # 2. 构造变量桥接兼容层
    bridge_vars = """
/* ==========================================================================
   19. DIDI Homepage Variables Bridge for Dossier Theme (Auto-Adaptation)
   ========================================================================== */

:root {
  --color-bg-primary: var(--paper);
  --color-bg-secondary: var(--paper-2);
  --color-bg-tertiary: var(--paper-3);
  --color-bg-card: var(--paper-2);
  --color-bg-glass: rgba(241, 239, 234, 0.85); /* 浅色磨砂纸张效果 */
  
  --color-accent: var(--accent);
  --color-accent-dim: var(--accent-soft);
  --color-accent-glow: rgba(198, 67, 28, 0.2);
  
  --color-text-primary: var(--ink);
  --color-text-secondary: var(--ink-2);
  --color-text-tertiary: var(--muted);
  --color-text-accent: var(--accent);
  
  --color-border: var(--line);
  --color-border-hover: var(--accent);
}

/* 首页组件 dossier 主题兼容补丁 */
.hero__container {
  border: 1px dashed var(--line);
  background: var(--paper-2);
}

.hero__stats {
  border-top: 1px dashed var(--line);
  background: var(--paper-3);
}

.hero__stat {
  border-right: 1px dashed var(--line);
}

.hero__stat:last-child {
  border-right: none;
}

.pillars__grid, .sensor__grid, .ecosystem__grid {
  border: 1px dashed var(--line-soft);
}

.pillars__card, .sensor__card, .ecosystem__card {
  background: var(--paper-2);
  border: 1px solid var(--line-soft);
}

.pillars__card:hover, .sensor__card:hover, .ecosystem__card:hover {
  border-color: var(--accent);
  background: var(--paper-3);
}

"""
    
    # 3. 读出 dossier 现在的 css 内容
    with open(dossier_css_path, 'r', encoding='utf-8') as f:
        dossier_content = f.read()
        
    # 4. 合并并追加
    updated_dossier = dossier_content + "\n" + bridge_vars + "\n" + homepage_css
    
    # 5. 写回
    with open(dossier_css_path, 'w', encoding='utf-8') as f:
        f.write(updated_dossier)
        
    print(f"Successfully bridged homepage CSS (added {len(homepage_css)} bytes of styles)")

if __name__ == '__main__':
    main()
