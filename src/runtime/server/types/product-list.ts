import type { ShopwareAuditFields } from './shared';

export interface ProductListItem {
  id: string;
  productListId: string;
  productId: string;
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface ProductList extends ShopwareAuditFields {
  name: string;
  customerId: string;
  isPublic: boolean;
  items: ProductListItem[];
  itemCount: number;
}
