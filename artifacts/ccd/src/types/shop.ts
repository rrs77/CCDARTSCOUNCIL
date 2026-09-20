/**
 * Hub shop types — products, orders, and per-hub sales analytics.
 */

export type HubProductStatus = 'draft' | 'published' | 'archived';

export type HubFulfillmentType =
  | 'pack'
  | 'resource'
  | 'external'
  | 'manual'
  | 'seed';

export type ShopOrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'demo';

export interface HubProduct {
  id: string;
  organisation_id: string;
  slug: string;
  title: string;
  description?: string | null;
  meta_label?: string | null;
  price_pence: number;
  currency: string;
  status: HubProductStatus;
  fulfillment_type: HubFulfillmentType;
  pack_id?: string | null;
  resource_id?: string | null;
  external_url?: string | null;
  seed_product_id?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopCustomerRow {
  buyer_email?: string | null;
  buyer_user_id?: string | null;
  orders: number;
  spent_pence: number;
  last_purchase_at?: string | null;
  hubs?: string[];
  products?: { title: string; organisation_id: string; price_pence: number; paid_at?: string }[];
}

export interface HubSalesSummary {
  organisation_id: string;
  days: number;
  total_orders: number;
  total_units: number;
  gross_pence: number;
  currency: string;
  by_product: Record<
    string,
    { product_id?: string | null; title: string; units: number; gross_pence: number }
  >;
  customers: ShopCustomerRow[];
  lines: {
    id: string;
    order_id: string;
    product_id?: string | null;
    title: string;
    price_pence: number;
    quantity: number;
    line_total_pence: number;
    buyer_email?: string | null;
    payment_mode?: string;
    status: string;
    paid_at?: string | null;
    created_at: string;
  }[];
  warning?: string;
}

export interface AdminShopCustomersPayload {
  days: number;
  total_orders: number;
  gross_pence: number;
  currency: string;
  customers: ShopCustomerRow[];
  hubs: Record<
    string,
    { organisation_id: string; gross_pence: number; units: number; order_count: number }
  >;
  warning?: string;
}
