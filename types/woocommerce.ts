export interface WCImage {
  id?: number;
  src?: string;
  alt?: string;
  name?: string;
  srcset?: string;
}

export interface WCProduct {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  images?: WCImage[];
  [key: string]: any;
}

export interface WCCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  count?: number;
  [key: string]: any;
}

export interface CartItem {
  key: string;
  product: {
    id: string | number;
    name: string;
    price: string | number;
    image?: string;
  };
  quantity: number;
  total: string | number;
}