import os

def main():
    target_dir = '../../themes/dossier/views'
    files = [
        'about.njk', 'specs.njk', 'technology.njk', 'use-cases.njk',
        'faq.njk', 'legal.njk', 'blog-list.njk', 'blog-detail.njk'
    ]
    
    for f in files:
        path = os.path.join(target_dir, f)
        if not os.path.exists(path):
            print(f"Error: {path} not found")
            continue
            
        # 1. 读出内容
        with open(path, 'r', encoding='utf-8') as file_read:
            content = file_read.read()
            
        # 2. 替换
        updated = content.replace('extends "layouts/base.njk"', 'extends "layout.njk"')
        
        # 3. 写回内容
        with open(path, 'w', encoding='utf-8') as file_write:
            file_write.write(updated)
            
        print(f"Successfully processed {f} (size: {len(updated)} bytes)")

if __name__ == '__main__':
    main()
