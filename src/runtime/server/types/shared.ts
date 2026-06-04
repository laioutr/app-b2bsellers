/**
 * Shared wire-DTO shapes for the B2B Sellers Store API (Shopware 6).
 *
 * These mirror the *wire* shapes the Store API returns — deliberately kept
 * separate from the Laioutr canonical component/entity types. Mapping from
 * these DTOs into canonical entities is part of the Orchestr handler layer,
 * which is added in a later iteration (see REQUIREMENTS-ORCHESTR.md).
 */

/** Standard Shopware list-response envelope. */
export interface ShopwareListResponse<T> {
  elements: T[];
  total: number;
  page?: number;
  limit?: number;
  /** Aggregations keyed by name, when requested via Criteria. */
  aggregations?: Record<string, unknown>;
}

/** Shopware calculated price / money shape (major-unit float + tax breakdown). */
export interface ShopwareMoney {
  unitPrice: number;
  totalPrice: number;
  quantity?: number;
  currencyId?: string;
  calculatedTaxes?: Array<{ tax: number; taxRate: number; price: number }>;
}

/** Common audit fields present on most Shopware entities. */
export interface ShopwareAuditFields {
  id: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Minimal Shopware Criteria object accepted by the `(Criteria)`-marked
 * endpoints. Intentionally loose for the raw wrapper layer — a stricter,
 * shared Criteria schema is part of the Orchestr-token work.
 *
 * @see https://developer.shopware.com/docs/concepts/api/store-api/#criteria
 */
export interface ShopwareCriteria {
  page?: number;
  limit?: number;
  term?: string;
  ids?: string[];
  filter?: unknown[];
  sort?: Array<{ field: string; order: 'ASC' | 'DESC'; naturalSorting?: boolean }>;
  associations?: Record<string, unknown>;
  aggregations?: unknown[];
  'total-count-mode'?: number;
  [key: string]: unknown;
}
