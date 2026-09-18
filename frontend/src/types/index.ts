// Standart API yanıt sarmalayıcısı
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp?: string;
}

// 1. Kimlik Doğrulama & Kiracı Tipleri
export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_USER';

export interface User {
  username: string;
  role: UserRole;
  tenantId: string;
  fullName?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  tokenType: string;
  username: string;
  email?: string;
  role: UserRole;
  tenantId: string;
  fullName?: string;
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

// 2. Stok & Ürün Tipleri
export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parentId?: number;
}

export type ProductType = 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'SERVICE' | 'COMMERCIAL_GOOD';

export interface ProductVariant {
  id: number;
  productId?: number;
  productName?: string;
  productType?: ProductType;
  partnerName?: string;
  sku: string;
  barcode?: string;
  variantName?: string;
  size?: string;
  color?: string;
  purchasePrice?: number;
  salePrice?: number;
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
  productType?: ProductType;
  partnerId?: number;
  partnerName?: string;
  description?: string;
  basePrice: number;
  baseUnit?: string;
  taxRate?: number;
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

// 3. Cari Hesap Tipleri
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
  totalDebit?: number;
  totalCredit?: number;
  balance?: number;
  createdAt?: string;
}

export interface StatementLine {
  id: number;
  date: string;
  documentType: string;
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: string;
  currency: string;
}

export interface PartnerStatement {
  partnerId: number;
  partnerName: string;
  partnerCode: string;
  partnerType: PartnerType;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  lines: StatementLine[];
}

// 4. Teklif Tipleri
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

// 5. Sipariş Tipleri
export type OrderType = 'SALES_ORDER' | 'PURCHASE_ORDER';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface OrderItem {
  id?: number;
  variantId: number;
  variantSku?: string;
  sku?: string;
  productName?: string;
  variantName?: string;
  description?: string;
  quantity: number;
  deliveredQuantity?: number;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
  lineTotal?: number;
  subtotal?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  quotationId?: number;
  partnerId: number;
  partnerTitle?: string;
  type: OrderType;
  orderType?: OrderType;
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  createdAt?: string;
}

export interface CreateOrderRequest {
  partnerId: number;
  type?: OrderType;
  orderType?: OrderType;
  notes?: string;
  items: Array<{
    variantId: number;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    description?: string;
  }>;
}

// 6. İrsaliye Tipleri
export type WaybillType = 'DISPATCH' | 'RECEIPT';
export type WaybillStatus = 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface WaybillItem {
  id?: number;
  orderItemId?: number;
  variantId: number;
  variantSku?: string;
  sku?: string;
  productName?: string;
  variantName?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  lotNumber?: string;
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

// 7. Denetim İzi (Audit Log) Tipleri
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

// 8. Fatura Tipleri
export type InvoiceType = 'SALES_INVOICE' | 'PURCHASE_INVOICE';
export type InvoiceStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id?: number;
  variantId?: number;
  variantName?: string;
  sku?: string;
  variantSku?: string;
  productName?: string;
  waybillItemId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate?: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  partnerId: number;
  partnerTitle?: string;
  partner?: { id: number; name: string; title?: string };
  orderId?: number;
  waybillId?: number;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  exchangeRate: number;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt?: string;
}

export interface CreateInvoiceRequest {
  invoiceType: InvoiceType;
  partnerId: number;
  orderId?: number;
  waybillId?: number;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  items: Array<{
    variantId?: number;
    waybillItemId?: number;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountRate?: number;
  }>;
}

// 9. Ödeme ve Tahsilat Tipleri
export type PaymentType = 'INCOMING' | 'OUTGOING';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Payment {
  id: number;
  paymentNumber: string;
  paymentType: PaymentType;
  invoiceId: number;
  invoiceNumber?: string;
  partnerId: number;
  partnerName?: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  accountId?: number;
  accountName?: string;
  paymentDate: string;
  referenceNumber?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt?: string;
}

export interface CreatePaymentRequest {
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId?: number;
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
  currency?: string;
  exchangeRate?: number;
}

// 10. Üretim & Ürün Reçetesi (BOM) Tipleri
export type WorkOrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface BomItem {
  id?: number;
  componentVariantId: number;
  componentSku?: string;
  componentName?: string;
  quantity: number;
  unit: string;
  scrapRate?: number;
  description?: string;
}

export interface BillOfMaterials {
  id: number;
  bomCode: string;
  name: string;
  variantId: number;
  variantSku?: string;
  variantName?: string;
  quantity: number;
  unit: string;
  description?: string;
  industryType: string;
  active: boolean;
  metadata?: Record<string, any>;
  items: BomItem[];
  createdAt?: string;
}

export interface CreateBomRequest {
  bomCode?: string;
  name: string;
  variantId: number;
  quantity: number;
  unit?: string;
  description?: string;
  industryType?: string;
  metadata?: Record<string, any>;
  items: Array<{
    componentVariantId: number;
    quantity: number;
    unit?: string;
    scrapRate?: number;
    description?: string;
  }>;
}

export interface WorkOrderItem {
  id?: number;
  componentVariantId: number;
  componentSku?: string;
  componentName?: string;
  plannedQuantity: number;
  consumedQuantity: number;
  unit: string;
}

export interface WorkOrder {
  id: number;
  orderNumber: string;
  bomId: number;
  bomCode?: string;
  bomName?: string;
  productVariantId?: number;
  productVariantSku?: string;
  productVariantName?: string;
  salesOrderId?: number;
  sourceWarehouseId?: number;
  sourceWarehouseName?: string;
  targetWarehouseId?: number;
  targetWarehouseName?: string;
  plannedQuantity: number;
  producedQuantity: number;
  status: WorkOrderStatus;
  priority: string;
  startDate?: string;
  dueDate?: string;
  completionDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
  items: WorkOrderItem[];
  createdAt?: string;
}

export interface CreateWorkOrderRequest {
  bomId: number;
  salesOrderId?: number;
  sourceWarehouseId?: number;
  targetWarehouseId?: number;
  plannedQuantity: number;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface SectorTemplate {
  sectorKey: string;
  name: string;
  description: string;
  icon: string;
  commonUnits: string[];
  dynamicAttributes: string[];
  sampleBom: {
    mamul: string;
    bilesenler: string[];
  };
  criticalTracking: string;
}

// 11. Kasa & Banka Tipleri
export type TreasuryAccountType = 'CASH' | 'BANK';

export interface TreasuryAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: TreasuryAccountType;
  currency: string;
  currentBalance: number;
  bankName?: string;
  branchCode?: string;
  iban?: string;
  active: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTreasuryAccountRequest {
  accountCode?: string;
  accountName: string;
  accountType: TreasuryAccountType;
  currency?: string;
  initialBalance?: number;
  bankName?: string;
  branchCode?: string;
  iban?: string;
  notes?: string;
}

