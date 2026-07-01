import { describe, it, expect, beforeEach } from 'vitest';
import { OrderStore } from '../../src/domain/orderStore';

const draft = {
  origin: { name: '国贸三期' },
  destination: { name: '望京SOHO T3' },
};

describe('OrderStore', () => {
  let store: OrderStore;
  beforeEach(() => { store = new OrderStore(); });

  it('creates an order at accepted with a timeline entry', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(o.id).toMatch(/.+/);
    expect(o.status).toBe('accepted');
    expect(o.timeline).toHaveLength(1);
    expect(o.timeline[0].status).toBe('accepted');
  });

  it('retrieves by id', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(store.get(o.id)?.id).toBe(o.id);
  });

  it('advances status and appends timeline', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    store.advance(o.id, 'confirmed');
    const got = store.get(o.id)!;
    expect(got.status).toBe('confirmed');
    expect(got.timeline.map((t) => t.status)).toEqual(['accepted', 'confirmed']);
  });

  it('cancels when cancellable', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    expect(store.cancel(o.id)).toBe(true);
    expect(store.get(o.id)!.status).toBe('cancelled');
  });

  it('refuses cancel after driver assigned', () => {
    const o = store.create('13800000000', draft.origin, draft.destination);
    store.advance(o.id, 'driver_assigned');
    expect(store.cancel(o.id)).toBe(false);
    expect(store.get(o.id)!.status).toBe('driver_assigned');
  });
});
