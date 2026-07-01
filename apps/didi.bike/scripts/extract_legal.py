import os
import re

def extract_content(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 提取 <div class="legal-module__Vq3eFG__content"> 到对应的闭合 </div> 之间的内容
    # 由于可能存在嵌套的 div，我们使用基于标签闭合计数的方式
    start_tag = 'class="legal-module__Vq3eFG__content"'
    start_idx = html.find(start_tag)
    if start_idx == -1:
        # 尝试模糊匹配，因为哈希值可能会有细微差异
        match = re.search(r'class="legal-module__[a-zA-Z0-9]+__content"', html)
        if match:
            start_idx = match.start()
        else:
            print(f"Error: content div not found in {html_path}")
            return None
    
    # 找到该 div 标签的起始 <
    div_start = html.rfind('<div', 0, start_idx)
    if div_start == -1:
        print(f"Error: div start not found in {html_path}")
        return None
        
    # 我们从 div_start 开始，往下数 <div> 和 </div> 的闭合计数
    depth = 0
    idx = div_start
    length = len(html)
    
    while idx < length:
        if html[idx:idx+4] == '<div':
            depth += 1
            idx += 4
        elif html[idx:idx+5] == '</div':
            depth -= 1
            if depth == 0:
                # 找到完全对应的闭合 </div>
                end_idx = idx + 6 # 包括 '</div>' 字符
                break
            idx += 5
        else:
            idx += 1
    else:
        print(f"Error: matching closing div not found in {html_path}")
        return None
        
    # 提取出的 HTML 片段
    content_html = html[div_start:end_idx]
    
    # 清理掉最外层的 <div class="..."> 和 </div>，我们只需要内部的元素，即 <h1> 以及正文
    # 去除外层 <div>
    first_close_bracket = content_html.find('>')
    if first_close_bracket != -1:
        content_html = content_html[first_close_bracket + 1:]
    if content_html.endswith('</div>'):
        content_html = content_html[:-6]
        
    return content_html.strip()

def main():
    base_dir = 'src/config/legal'
    files = [
        'privacy-policy-en.html', 'privacy-policy-id.html',
        'terms-of-service-en.html', 'terms-of-service-id.html',
        'cookie-policy-en.html', 'cookie-policy-id.html',
        'trademark-notice-en.html', 'trademark-notice-id.html'
    ]
    
    for filename in files:
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping missing file: {filepath}")
            continue
            
        print(f"Extracting {filepath} ...")
        content = extract_content(filepath)
        if content:
            out_name = filename.replace('.html', '-content.html')
            out_path = os.path.join(base_dir, out_name)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Saved content to {out_path} ({len(content)} bytes)")

if __name__ == '__main__':
    main()
