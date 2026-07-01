import path from 'path';

/**
 * 一个页面内容块：类型 + 数据。页面内容（PageDef.blocks）由站点/内容层定义，
 * 具体渲染由主题的 views/blocks/{type}.njk 或本包提供的通用 block 完成。
 */
export interface BlockInstance<T = Record<string, unknown>> {
  type: string;
  data: T;
}

/** 逃生舱：无规律、一次性的内容直接以原始 HTML 嵌入，不强行套用任何结构化 block。 */
export interface CustomHtmlBlockData {
  html: string;
}

/** 本包 views/ 的绝对路径，供 site-kit 注入 Nunjucks 搜索路径，使各主题共享这里的通用 block。 */
export const blocksViewsDir = path.join(path.resolve(__dirname, '..'), 'views');
