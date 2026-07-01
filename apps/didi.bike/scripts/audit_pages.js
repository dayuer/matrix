const fs = require('fs');
const path = require('path');

// 动态载入 site-def.ts 来获取全部物理路由列表
async function main() {
  console.log("=== DIDI.BIKE 全站页面自动化走查开始 ===");

  // 1. 获取所有物理导出 html 的路径
  // 我们可以通过遍历 out 文件夹来取得所有实际生成的物理 HTML 页面
  const outDir = path.join(__dirname, '..', 'out');
  if (!fs.existsSync(outDir)) {
    console.error("错误: 找不到 out 目录，请先执行 npm run export");
    process.exit(1);
  }

  const routes = [];
  
  function scan(dir, base = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relPath = base ? `${base}/${file}` : file;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath, relPath);
      } else if (file.endsWith('.html')) {
        // 如果是 index.html，路径就是目录名；如果是 404.html 就是 /404.html
        let route = '/' + relPath;
        if (file === 'index.html') {
          route = '/' + base;
        }
        routes.push(route);
      }
    }
  }

  scan(outDir);
  
  // 过滤和规范化路由
  const uniqRoutes = Array.from(new Set(routes)).map(r => {
    // 把 // 替换为 /
    let cleaned = r.replace(/\/+/g, '/');
    // 去掉末尾的 / (除了根路径 /)
    if (cleaned.length > 1 && cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  });

  console.log(`共扫描到已编译的物理 HTML 路由数: ${uniqRoutes.length} 个`);

  // 2. 逐一对本地 Express (3003 端口) 发起请求走查
  const baseUrl = 'http://localhost:3003';
  let successCount = 0;
  let failCount = 0;
  const failures = [];

  for (let i = 0; i < uniqRoutes.length; i++) {
    const r = uniqRoutes[i];
    // 跳过纯 404.html 的物理文件验证（它不是 Express 的普通路由，Express 对 404 有特殊拦截）
    if (r === '/404.html') continue;

    const url = baseUrl + r;
    process.stdout.write(`[${i+1}/${uniqRoutes.length}] 正在测试: ${r} ... `);

    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        process.stdout.write(`❌ 失败 (HTTP ${res.status})\n`);
        failCount++;
        failures.push({ route: r, error: `HTTP Status ${res.status}` });
        continue;
      }

      const html = await res.text();

      // 3. 校验页面内容是否存在未解析模板标志等致命错误
      let checkErr = null;
      if (html.includes('{%') || html.includes('%}')) {
        checkErr = "发现未解析的 Nunjucks 控制语句 {% 或 %}";
      } else if (html.includes('{{') && !html.includes('{{content}}') && !html.includes('window.__next_f')) {
        // 注意过滤 Next.js 原生的 inline script 里的 {{ 标记，只匹配正文里裸露的 {{
        const matches = html.match(/\{\{[^}]+\}\}/g);
        if (matches && matches.some(m => !m.includes('window.__next_f'))) {
          checkErr = `发现未解析的 Nunjucks 变量输出 ${matches.join(', ')}`;
        }
      }

      if (checkErr) {
        process.stdout.write(`⚠️ 警告 (${checkErr})\n`);
        failCount++;
        failures.push({ route: r, error: checkErr });
      } else {
        process.stdout.write(`✅ 成功 (200 OK, 长度 ${html.length})\n`);
        successCount++;
      }
    } catch (e) {
      process.stdout.write(`❌ 异常 (${e.message})\n`);
      failCount++;
      failures.push({ route: r, error: e.message });
    }
  }

  console.log("\n=== 走查结果报告 ===");
  console.log(`成功测试: ${successCount} 个页面`);
  console.log(`失败/异常: ${failCount} 个页面`);

  if (failures.length > 0) {
    console.log("\n失败页面详情:");
    failures.forEach(f => {
      console.log(`- 路由 [${f.route}]: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log("\n🎉 全站页面全部通过测试，Express 服务表现完美，无任何 404 或未解析模板标记！");
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
