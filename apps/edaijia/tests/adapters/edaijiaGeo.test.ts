import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EdaijiaGeoAdapter } from '../../src/adapters/edaijiaGeo';

describe('EdaijiaGeoAdapter', () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    console.warn = vi.fn(); // 屏蔽测试中的 console.warn 噪音
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });

  it('1. 正常定位接口解析：提取 POI 和地址', async () => {
    const mockSuccessResponse = {
      code: 0,
      location: {
        street: {
          component: {
            city: '北京市',
            town: '前门街道',
          }
        },
        pois: [
          { name: '正阳门', lng: '116.40', lat: '39.90' },
          { name: '天安门广场', lng: '116.41', lat: '39.91' }
        ]
      }
    };

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSuccessResponse),
    });

    const adapter = new EdaijiaGeoAdapter();
    const res = await adapter.reverse(116.40, 39.90, '北京');

    expect(res.address).toBe('正阳门');
    expect(res.pois).toHaveLength(2);
    expect(res.pois[0].name).toBe('正阳门');
    expect(res.pois[0].lng).toBe(116.40);
    expect(res.pois[0].lat).toBe(39.90);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('2. 线上返回非0错误：优雅降级到 Mock 数据', async () => {
    const mockFailResponse = {
      code: -1000,
      message: 'sig error'
    };

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockFailResponse),
    });

    const adapter = new EdaijiaGeoAdapter();
    const res = await adapter.reverse(116.40, 39.90, '成都');

    // 验证返回的是降级后的 Mock 数据（成都）
    expect(res.address).toBe('成都市朝阳区国贸附近');
    expect(res.pois[0].name).toBe('成都建国门外大街1号国贸商城');
    expect(console.warn).toHaveBeenCalled();
  });

  it('3. WAF 拦截 (403)：优雅降级到 Mock 数据', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '<html>Forbidden</html>',
    });

    const adapter = new EdaijiaGeoAdapter();
    const res = await adapter.reverse(116.40, 39.90, '广州');

    expect(res.address).toBe('广州市朝阳区国贸附近');
    expect(console.warn).toHaveBeenCalled();
  });

  it('4. 搜索接口 search：直接返回 Mock 数据保障体验', async () => {
    const adapter = new EdaijiaGeoAdapter();
    const res = await adapter.search('国贸', '上海');
    expect(res.pois).toHaveLength(2);
    expect(res.pois[0].name).toContain('上海');
  });
});
