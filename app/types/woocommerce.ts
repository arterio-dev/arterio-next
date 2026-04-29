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

// ─── Variation Types (WC REST API v3) ─────────────────────────────────────────

export interface WCVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: string;
  purchasable: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
  image: WCImage;
  attributes: WCVariationAttribute[];
}

export interface WCVariationAttribute {
  id: number;
  name: string;
  option: string;
}

// ─── Store API Attribute Types ────────────────────────────────────────────────

export interface StoreApiAttribute {
  id: number;
  name: string;
  taxonomy: string;
  has_variations: boolean;
  terms: StoreApiTerm[];
}

export interface StoreApiTerm {
  id: number;
  name: string;
  slug: string;
  default: boolean;
  count?: number;
}

export interface StoreApiVariationRef {
  id: number;
  attributes: { attribute: string; value: string }[];
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
  categoryId?: string; // ID da categoria para navegação
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
