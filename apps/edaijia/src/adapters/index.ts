import { AppDeps } from './types';
import { createFakeDeps, FakeBackend } from './fake';
import { EdaijiaGeoAdapter } from './edaijiaGeo';
import { HttpSmsAdapter } from './httpSms';
import { HttpLlmAdapter } from './httpLlm';
import { HttpCarrierAdapter } from './httpCarrier';
import { OrderStore } from '../domain/orderStore';

/**
 * 依赖注入装配：一期默认全 fake，按环境变量逐项切换真实 provider。
 * 每个真实 provider 都内建优雅降级，缺配置 / 上游故障时退回 fake，绝不卡死下单。
 */
export function getDeps(): AppDeps {
  const deps: AppDeps = createFakeDeps(process.env.TOKEN_SECRET || 'dev-secret');

  // 定位：真实 e代驾 GPS 逆地理
  if (process.env.GEO_PROVIDER === 'edaijia') {
    deps.geo = new EdaijiaGeoAdapter();
  }

  // 短信：真实 HTTP 短信网关（含 magic link 送达）
  if (process.env.SMS_PROVIDER === 'http') {
    try {
      deps.sms = new HttpSmsAdapter();
    } catch (err) {
      console.error('[deps] SMS 网关装配失败，保留内存 fake:', (err as Error).message);
    }
  }

  // 运营商一键登录：真实号码认证校验
  if (process.env.CARRIER_PROVIDER === 'http') {
    try {
      deps.carrier = new HttpCarrierAdapter();
    } catch (err) {
      console.error('[deps] 运营商认证装配失败，保留 fake:', (err as Error).message);
    }
  }

  // AI 解析：真实 LLM（OpenAI 兼容），失败降级注入的 fake 正则解析器
  if (process.env.LLM_PROVIDER === 'http') {
    try {
      deps.llm = new HttpLlmAdapter(deps.llm);
    } catch (err) {
      console.error('[deps] LLM 装配失败，保留 fake 解析器:', (err as Error).message);
    }
  }

  // 订单存储：可选文件持久化（重启不丢在途单）。真实场景应替换为 e代驾 核心后台 BackendAdapter。
  if (process.env.ORDER_STORE_FILE) {
    deps.backend = new FakeBackend(new OrderStore({ file: process.env.ORDER_STORE_FILE }));
  }

  return deps;
}
