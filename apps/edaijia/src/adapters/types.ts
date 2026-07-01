import { OrderDraft, ParseResult, Order, Place } from '../domain/types';

/** 流式推送的单个 chunk */
export interface StreamChunk {
  /** 增量文本片段（思考 or 正文） */
  delta: string;
  /** 是否属于 <think> 推理过程（DeepSeek-R1 特有） */
  thinking?: boolean;
}

export interface LlmAdapter {
  parse(text: string, city: string): Promise<ParseResult>;
  /** 流式解析：逐 token 回调，最终返回完整 ParseResult */
  parseStream?(
    text: string,
    city: string,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ParseResult>;
}

export interface GeoResult {
  address?: string;
  pois: Place[];
}

export interface GeoAdapter {
  reverse(lng: number, lat: number, city: string): Promise<GeoResult>;
  search(keyword: string, city: string): Promise<GeoResult>;
}

export interface SmsAdapter {
  send(phone: string, text: string): Promise<void>;
}

export interface CarrierAuthAdapter {
  /** 校验运营商一键登录 token，成功返回手机号，失败返回 null */
  verify(token: string): Promise<string | null>;
}

export interface BackendAdapter {
  createOrder(phone: string, draft: Required<Pick<OrderDraft, 'origin' | 'destination'>> & OrderDraft): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  cancelOrder(id: string): Promise<boolean>;
}

export interface AppDeps {
  llm: LlmAdapter;
  geo: GeoAdapter;
  sms: SmsAdapter;
  carrier: CarrierAuthAdapter;
  backend: BackendAdapter;
  tokenSecret: string;
}
