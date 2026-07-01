import { OrderStore } from '../domain/orderStore';
import { OrderDraft, ParseResult } from '../domain/types';
import {
  AppDeps,
  BackendAdapter,
  CarrierAuthAdapter,
  GeoAdapter,
  GeoResult,
  LlmAdapter,
  SmsAdapter,
} from './types';

const fakeLlm: LlmAdapter = {
  async parse(text): Promise<ParseResult> {
    if (/代检|拖车|洗车|保养/.test(text)) {
      return { intent: 'other', card: {}, missing: [], confidence: 0.9, futureTimeDetected: false };
    }
    const futureTimeDetected = /明天|后天|预约|小时后|稍后|稍晚/.test(text);
    const cleanText = text.replace(/\s+/g, '');
    const dest = cleanText.match(/(?:去|到|回|送到|送回|回到)\s*([一-龥A-Za-z0-9]+)/)?.[1];
    const origin = cleanText.match(/在\s*([一-龥A-Za-z0-9]+?)(?:喝|附近|这边|，|,|$)/)?.[1];
    const card: OrderDraft = {
      origin: origin ? { name: origin } : undefined,
      destination: dest ? { name: dest } : undefined,
    };
    const missing: ParseResult['missing'] = [];
    if (!card.origin) missing.push('origin');
    if (!card.destination) missing.push('destination');
    const ask = missing[0] === 'destination' ? '要去哪？' : missing[0] === 'origin' ? '你在哪？' : undefined;
    return { intent: 'ride', card, missing, ask, confidence: missing.length ? 0.5 : 0.8, futureTimeDetected };
  },
};

const fakeGeo: GeoAdapter = {
  async reverse(lng, lat, city): Promise<GeoResult> {
    return { address: `${city}某地`, pois: [{ name: `${city}某地A`, lng, lat }, { name: `${city}某地B`, lng, lat }] };
  },
  async search(keyword, city): Promise<GeoResult> {
    return { pois: [{ name: `${keyword}（${city}）`, lng: 116.4, lat: 39.9 }] };
  },
};

class RecordingSms implements SmsAdapter {
  sent: { phone: string; text: string }[] = [];
  async send(phone: string, text: string): Promise<void> {
    this.sent.push({ phone, text });
  }
}

const fakeCarrier: CarrierAuthAdapter = {
  async verify(token): Promise<string | null> {
    const m = token.match(/^carrier:(\d{11})$/);
    return m ? m[1] : null;
  },
};

export class FakeBackend implements BackendAdapter {
  constructor(private store = new OrderStore()) {}
  async createOrder(phone: string, draft: OrderDraft) {
    return this.store.create(phone, draft.origin!, draft.destination!, draft.riderPhone);
  }
  async getOrder(id: string) {
    return this.store.get(id);
  }
  async cancelOrder(id: string) {
    return this.store.cancel(id);
  }
  /** 测试 / 演示用：推进状态 */
  store_(): OrderStore {
    return this.store;
  }
}

export function createFakeDeps(secret = 'dev-secret'): AppDeps & { sms: RecordingSms; backend: FakeBackend } {
  return {
    llm: fakeLlm,
    geo: fakeGeo,
    sms: new RecordingSms(),
    carrier: fakeCarrier,
    backend: new FakeBackend(),
    tokenSecret: secret,
  };
}
