// PocketBase data model type definitions

/** Cluster slug union type (aligned with lib/clusters.ts) */
export type ClusterSlug =
  | 'aerodynamics-cda'
  | 'bike-fitting'
  | 'power-pedaling'
  | 'sensor-telemetry'
  | 'training-racing'
  | 'integrations'
  | 'use-cases'
  | 'glossary';

/** FAQ item structure for FAQPage JSON-LD */
export interface FAQItem {
  question: string;
  answer: string;
}

/** Blog post record */
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover?: string;
  tags?: string[];
  publishedAt?: string;
  published?: boolean;
  created?: string;
  updated?: string;
  collectionId?: string;
  // Metadata content engine fields (all optional, backward compatible)
  locale?: 'en' | 'id';
  cluster?: ClusterSlug;
  isPillar?: boolean;
  pillarSlug?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  faqJson?: FAQItem[];
}

/** Paginated blog post list */
export interface PostList {
  items: Post[];
  totalPages: number;
  totalItems: number;
  page: number;
}

/** PocketBase standard paginated list response */
export interface PBListResponse<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}
