/**
 * city.ts — BFF 城市列表代理
 *
 * 职责：代理调用 api.edaijia.cn 的 open.city.list 接口，
 *       服务端签名解决 CORS + 密钥安全问题。
 *       结果缓存 1 小时，避免频繁请求上游。
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';

const router = Router();

// ── 上游 API 配置（来自原站 common.js） ──
const API_BASE = 'https://api.edaijia.cn/rest/';
const MD5KEY = '0c09bc02-c74e-11e2-a9da-00163e1210d9';
const CONFIG = {
  appkey: '51000031',
  ver: 3,
  udid: 'h5__9094fe2f4ae64e5557a92645db8091b6',
  from: 'edaijia',
  macaddress: '12:34:56:78:9A:BC',
};

// ── 缓存 ──
interface CityCache {
  data: CityGroup[];
  expiry: number;
}
interface CityGroup {
  letter: string;
  cities: { name: string; id: string }[];
}

let cache: CityCache | null = null;
const CACHE_TTL = 3600_000; // 1 小时

// ── 工具函数 ──

/** UTC+8 时间戳格式化为 yyyy-MM-dd hh:mm:ss */
function formatTimestamp(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 3600000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${utc8.getFullYear()}-${pad(utc8.getMonth() + 1)}-${pad(utc8.getDate())} ${pad(utc8.getHours())}:${pad(utc8.getMinutes())}:${pad(utc8.getSeconds())}`;
}

/** 复刻原站 getSigOld：所有参数 key 排序 → 拼接 key+value → 末尾加 MD5KEY → MD5 */
function signParams(params: Record<string, string | number>): string {
  const keys = Object.keys(params).sort();
  const str = keys.map(k => `${k}${params[k]}`).join('') + MD5KEY;
  return crypto.createHash('md5').update(str).digest('hex');
}

/** 构造带签名的完整查询字符串 */
function buildUrl(): string {
  const params: Record<string, string | number> = {
    ...CONFIG,
    method: 'open.city.list',
    only_city: '1',
    timestamp: formatTimestamp(),
  };
  params.sig = signParams(params);

  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${API_BASE}?${qs}`;
}

/**
 * 将上游的 { cityName: cityId, ... } Map 按拼音首字母分组排序
 *
 * 上游返回格式示例：{ "cityList": { "北京": "1", "上海": "2", ... } }
 * 我们用 e代驾自己的拼音首字母库做分组（复刻 edj-widget-citybox.js 的逻辑）。
 * 由于原站的拼音算法复杂（20902 字 + 375 多音字），这里改用更简洁的 Unicode 偏移法。
 */

// 简易汉字拼音首字母（Unicode 区间划分，覆盖常见城市名）
const PINYIN_MAP: Record<string, string> = {
  // 多音字特殊处理（仅覆盖城市名）
  '重': 'C', '长': 'C', '朝': 'C', '佛': 'F', '沈': 'S', '厦': 'X',
  '宿': 'S', '六': 'L', '漯': 'L', '乐': 'L', '亳': 'B',
};

// Unicode 区间 → 首字母映射表（简化版，来自 GB2312 拼音排序）
const PY_RANGES: [number, string][] = [
  [45217, 'A'], [45253, 'B'], [45761, 'C'], [46318, 'D'], [46826, 'E'],
  [47010, 'F'], [47297, 'G'], [47614, 'H'], [48119, 'J'], [49062, 'K'],
  [49324, 'L'], [49896, 'M'], [50371, 'N'], [50614, 'O'], [50622, 'P'],
  [50906, 'Q'], [51387, 'R'], [51446, 'S'], [52218, 'T'], [52698, 'W'],
  [52980, 'X'], [53689, 'Y'], [54481, 'Z'],
];

function getFirstLetter(ch: string): string {
  // 多音字优先
  if (PINYIN_MAP[ch]) return PINYIN_MAP[ch];

  // GB2312 编码映射
  const buf = Buffer.from(ch, 'utf-8');
  // 对于中文字符，转 GBK 需要 iconv；这里用简化的 Unicode 排序
  // 回退到常用城市名人工映射
  const code = ch.charCodeAt(0);

  // 非中文字符直接返回大写
  if (code < 0x4e00 || code > 0x9fff) return ch.toUpperCase();

  // 使用 GB2312 区间（需要转 GB 编码）
  // 简化方案：直接使用 localeCompare 排序到最近的参考字
  const refs = 'ABCDEFGHJKLMNOPQRSTWXYZ';
  const refChars = '阿八嚓哒妸发旮哈击喀垃嘛拿噢妑七呥仨他挖夕丫帀';
  for (let i = refChars.length - 1; i >= 0; i--) {
    if (ch.localeCompare(refChars[i], 'zh-Hans-CN') >= 0) {
      return refs[i];
    }
  }
  return 'Z';
}

function getCityLetter(cityName: string): string {
  return getFirstLetter(cityName.charAt(0));
}

function groupCities(cityMap: Record<string, string>): CityGroup[] {
  const groups: Map<string, { name: string; id: string }[]> = new Map();

  for (const [name, id] of Object.entries(cityMap)) {
    const letter = getCityLetter(name);
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push({ name, id: String(id) });
  }

  // 按字母排序；组内按名称排序
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, cities]) => ({
      letter,
      cities: cities.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    }));
}

// ── 路由 ──
router.get('/cities', async (_req: Request, res: Response) => {
  // 缓存命中
  if (cache && Date.now() < cache.expiry) {
    return res.json({ cities: cache.data });
  }

  try {
    const url = buildUrl();
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://h5.edaijia.cn/new-app/index',
        'Origin': 'https://h5.edaijia.cn',
      }
    });
    const text = await resp.text();

    // 上游可能返回 JSONP 或 JSON
    let data: { code: number | string; cityList?: Record<string, string>; message?: string };
    try {
      data = JSON.parse(text);
    } catch {
      // JSONP 包装：callback({...})
      const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);\s*$/, '');
      data = JSON.parse(jsonStr);
    }

    // eslint-disable-next-line eqeqeq -- 上游 code 类型不稳定（数字 0 或字符串 "0"）
    if (data.code != 0 || !data.cityList) {
      console.error('[city] 上游返回异常:', data.message || text.slice(0, 200));
      return res.status(502).json({ error: '上游城市接口异常', hint: data.message });
    }

    const grouped = groupCities(data.cityList);

    // 写入缓存
    cache = { data: grouped, expiry: Date.now() + CACHE_TTL };

    return res.json({ cities: grouped });
  } catch (err) {
    console.error('[city] 请求上游失败:', err);
    return res.status(502).json({ error: '城市列表加载失败' });
  }
});

export default router;
