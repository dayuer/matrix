import { describe, it, expect } from 'vitest';
import { detectDevice } from '../../src/lib/device';

describe('detectDevice', () => {
  it('识别 iPhone Safari 为 mobile', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe('mobile');
  });

  it('识别 Android Chrome 为 mobile', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36')).toBe('mobile');
  });

  it('识别 iPad 为 mobile', () => {
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe('mobile');
  });

  it('识别微信浏览器为 mobile', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 MicroMessenger/8.0')).toBe('mobile');
  });

  it('识别桌面 Chrome 为 desktop', () => {
    expect(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')).toBe('desktop');
  });

  it('识别桌面 Firefox 为 desktop', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0')).toBe('desktop');
  });

  it('空 UA 字符串返回 desktop', () => {
    expect(detectDevice('')).toBe('desktop');
  });

  it('搜索引擎 Bot 返回 desktop', () => {
    expect(detectDevice('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe('desktop');
  });
});
