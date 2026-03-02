// WooCommerce Product Types
export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  categories: WCCategory[];
  images: WCImage[];
  attributes: WCAttribute[];
  variations: number[];
  meta_data: WCMetaData[];
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  description?: string;
  display?: string;
  image?: WCImage | null;
  count?: number;
}

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WCAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WCMetaData {
  id: number;
  key: string;
  value: string | number | boolean;
}

// Cart Types
export interface CartItem {
  key: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  product: WCProduct;
  subtotal: string;
  total: string;
}

export interface Cart {
  items: CartItem[];
  totals: {
    subtotal: string;
    total: string;
    currency: string;
  };
}

// Local Product Type (simplificado para o frontend)
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  image?: string;
  variants?: ProductVariant[];
  sku?: string;
  description?: string;
}

export interface ProductVariant {
  name: string;
  value: string;
}
