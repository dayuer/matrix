export interface Place {
  name: string;
  lng?: number;
  lat?: number;
  confirmed?: boolean;
}

export interface OrderDraft {
  origin?: Place;
  destination?: Place;
  riderPhone?: string;
  note?: string;
}

export type MissingField = 'origin' | 'destination';

export interface ParseResult {
  intent: 'ride' | 'other';
  card: OrderDraft;
  missing: MissingField[];
  ask?: string;
  confidence: number;
  futureTimeDetected: boolean;
}

export type OrderStatus =
  | 'accepted'
  | 'confirmed'
  | 'calling_driver'
  | 'driver_assigned'
  | 'no_driver'
  | 'out_of_range'
  | 'cancelled';

export interface TimelineEvent {
  status: OrderStatus;
  at: number;
}

export interface Order {
  id: string;
  phone: string;
  riderPhone?: string;
  origin: Place;
  destination: Place;
  status: OrderStatus;
  timeline: TimelineEvent[];
  createdAt: number;
}

export const CANCELLABLE: OrderStatus[] = ['accepted', 'confirmed', 'calling_driver'];
