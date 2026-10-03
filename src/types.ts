export interface Product {
  ItemId: number;
  StockId: number;
  ItemCode: string;
  StockCode: string;
  ItemDesc: string;
  PackSize: number;
  Vat: string;
  IsScannable: number;
  ColourDesc?: string;
  SizeDesc?: string;
  POSPrice1: number;
  SellPrice1: number;
  LastCost: number;
  AvgCost: number;
  QtyOnHand: number;
}

export interface Store {
  StoreId: number;
  StoreCode: string;
  StoreDesc: string;
  Tel?: string;
  Cell?: string;
  Email?: string;
  IsOnLine: number;
}

export interface Customer {
  AccId: number;
  AccCode: string;
  Company: string;
  Contact?: string;
  Tel?: string;
  Cell?: string;
  Email?: string;
  PriceListId?: number;
  AutoDisc: number;
  AllowPriceMatrix: number;
  CrLimit?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
  unit_price: number;
  unit_excl: number;
  unit_incl: number;
  vat_amount: number;
  disc_perc: number;
  amount: number;
  price_source: string;
  promotion_id?: number;
  promotion_desc?: string;
  one_off_discount_type?: 'PERCENT' | 'FIXED';
  one_off_discount_value?: number;
  one_off_discount_amount?: number;
}

export interface Quote {
  QuoteNo: string;
  AccId: number;
  StoreId: number;
  Company: string;
  Date: string;
  SubTotal: number;
  VatTotal: number;
  DiscPerc: number;
  QUStatus: string;
  StoreDesc?: string;
  PdfPath?: string;
}

export interface Invoice {
  INVNo: string;
  AccId: number;
  StoreId: number;
  Company: string;
  CreatedDt: string;
  SubTotal: number;
  VatTotal: number;
  AmtPaid: number;
  SerialNo: string;
  PdfPath?: string;
  StoreDesc?: string;
}

export interface Promotion {
  PromotionId: number;
  PromotionDesc: string;
  FromText: string;
  ToText: string;
  IsActive: number;
  ItemCount: number;
}

export interface PromotionItem {
  PromotionId: number;
  ItemId: number;
  StockId: number;
  ItemDesc: string;
  StockCode: string;
  StandardPrice: number;
  DiscountType: 'PRICE' | 'PERCENT' | 'FIXED';
  DiscountValue: number;
  MinQty: number;
  PromotionLimit: number;
  IsActive: number;
}

export interface PromotionWithItems extends Promotion {
  items: PromotionItem[];
}

export interface StockTakeItem {
  barcode: string;
  product?: Product;
  qty: number;
  timestamp: string;
}

export interface CustomerDetails {
  customer: Customer;
  invoices: Invoice[];
  quotes: Quote[];
  totals: {
    purchases: number;
    paid: number;
    outstanding: number;
    invoiceCount: number;
    quoteCount: number;
    quoteValue: number;
  };
}
