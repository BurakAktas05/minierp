// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp?: string;
}

// 1. Auth & Tenant Types
export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_USER';

export interface User {
  username: string;
  role: UserRole;
  tenantId: string;
  fullName?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email?: string;
  role: UserRole;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  schemaName: string;
  active: boolean;
  createdAt: string;
}

export interface CreateTenantRequest {
  tenantId: string;
  name: string;
}

// 2. Inventory & Product Types
export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  reservedStock: number;
  availableStock: number;
  priceAdjustment?: number;
  attributes?: Record<string, any>;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  categoryId?: number;
  categoryName?: string;
  attributes?: Record<string, any>;
  active: boolean;
  variants: ProductVariant[];
  createdAt?: string;
}

export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  categoryId?: number;
  attributes?: Record<string, any>;
  variants: Array<{
    sku: string;
    barcode?: string;
    size?: string;
    color?: string;
    initialStock?: number;
    priceAdjustment?: number;
    attributes?: Record<string, any>;
  }>;
}

// 3. Business Partner (Cari Hesap) Types
export type PartnerType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export interface BusinessPartner {
  id: number;
  code: string;
  title: string;
  taxNumber?: string;
  taxOffice?: string;
  type: PartnerType;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, any>;
  active: boolean;
  createdAt?: string;
}

// 4. Quotation (Teklif) Types
export type QuotationType = 'SALES' | 'PURCHASE';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface QuotationItem {
  id?: number;
  variantId: number;
  variantSku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal?: number;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  partnerId: number;
  partnerTitle?: string;
  type: QuotationType;
  status: QuotationStatus;
  issueDate: string;
  validUntil?: string;
  totalAmount: number;
  notes?: string;
  items: QuotationItem[];
  createdAt?: string;
}

export interface CreateQuotationRequest {
  partnerId: number;
  type: QuotationType;
  validUntil?: string;
  notes?: string;
  items: Array<{
    variantId: number;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
}

// 5. Order (Sipariş) Types
export type OrderType = 'SALES_ORDER' | 'PURCHASE_ORDER';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface OrderItem {
  id?: number;
  variantId: number;
  variantSku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  quotationId?: number;
  partnerId: number;
  partnerTitle?: string;
  type: OrderType;
  status: OrderStatus;
  orderDate: string;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  createdAt?: string;
}

export interface CreateOrderRequest {
  partnerId: number;
  type: OrderType;
  notes?: string;
  items: Array<{
    variantId: number;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
}

// 6. Waybill (İrsaliye) Types
export type WaybillType = 'DISPATCH' | 'RECEIPT';
export type WaybillStatus = 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface WaybillItem {
  id?: number;
  orderItemId?: number;
  variantId: number;
  variantSku?: string;
  productName?: string;
  quantity: number;
}

export interface Waybill {
  id: number;
  waybillNumber: string;
  orderId: number;
  orderNumber?: string;
  partnerId: number;
  partnerTitle?: string;
  type: WaybillType;
  status: WaybillStatus;
  waybillDate: string;
  carrierInfo?: string;
  trackingNumber?: string;
  notes?: string;
  items: WaybillItem[];
  createdAt?: string;
}

export interface CreateWaybillRequest {
  orderId: number;
  carrierInfo?: string;
  trackingNumber?: string;
  notes?: string;
  items: Array<{
    orderItemId?: number;
    variantId: number;
    quantity: number;
  }>;
}

// 7. Audit Log Types
export interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  oldValue?: string;
  newValue?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
