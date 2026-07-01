import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CANCELLABLE, Order, OrderStatus, Place } from './types';

export interface OrderStoreOptions {
  /** 传入文件路径则开启持久化：启动时加载、每次写操作后落盘。不传则纯内存（默认）。 */
  file?: string;
}

export class OrderStore {
  private orders = new Map<string, Order>();
  private file?: string;

  constructor(opts: OrderStoreOptions = {}) {
    this.file = opts.file;
    if (this.file) this.load();
  }

  create(phone: string, origin: Place, destination: Place, riderPhone?: string): Order {
    const now = Date.now();
    const order: Order = {
      id: randomUUID(),
      phone,
      riderPhone,
      origin,
      destination,
      status: 'accepted',
      timeline: [{ status: 'accepted', at: now }],
      createdAt: now,
    };
    this.orders.set(order.id, order);
    this.persist();
    return order;
  }

  get(id: string): Order | undefined {
    return this.orders.get(id);
  }

  advance(id: string, status: OrderStatus): Order | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    order.status = status;
    order.timeline.push({ status, at: Date.now() });
    this.persist();
    return order;
  }

  cancel(id: string): boolean {
    const order = this.orders.get(id);
    if (!order || !CANCELLABLE.includes(order.status)) return false;
    order.status = 'cancelled';
    order.timeline.push({ status: 'cancelled', at: Date.now() });
    this.persist();
    return true;
  }

  // ── 持久化（仅在传入 file 时启用） ──

  private load(): void {
    try {
      const raw = readFileSync(this.file!, 'utf8');
      const list = JSON.parse(raw) as Order[];
      for (const o of list) this.orders.set(o.id, o);
    } catch {
      // 文件不存在 / 损坏 → 从空开始，首次写入时重建
    }
  }

  private persist(): void {
    if (!this.file) return;
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      writeFileSync(this.file, JSON.stringify([...this.orders.values()]), 'utf8');
    } catch (err) {
      console.error('[orderStore] 持久化失败:', (err as Error).message);
    }
  }
}
