import { apiClient } from './client';
import { Product, ProductCreateRequest, ProductVariant, Category } from '../types';

export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    const res = await apiClient.get<any>('/inventory/products');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice || (p.variants && p.variants[0] ? Number(p.variants[0].salePrice) : 0),
      baseUnit: p.baseUnit || 'Adet',
      taxRate: Number(p.taxRate ?? 20),
      categoryId: p.categoryId,
      categoryName: p.categoryName || (p.category ? p.category.name : ''),
      productType: p.productType,
      partnerId: p.partnerId,
      active: p.active !== false,
      attributes: p.attributes || {},
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        productId: p.id,
        sku: v.sku,
        barcode: v.barcode,
        variantName: v.variantName || v.sku,
        purchasePrice: Number(v.purchasePrice ?? 0),
        salePrice: Number(v.salePrice ?? p.basePrice ?? 0),
        size: v.size || v.attributes?.size || v.attributes?.beden || (v.variantName && v.variantName.includes('/') ? v.variantName.split('/')[0].trim() : ''),
        color: v.color || v.attributes?.color || v.attributes?.renk || (v.variantName && v.variantName.includes('/') ? v.variantName.split('/')[1].trim() : v.variantName),
        stockQuantity: Number(v.stockQuantity ?? 0),
        reservedStock: Number(v.reservedStock ?? 0),
        availableStock: Number(v.availableStock ?? (v.stockQuantity - (v.reservedStock || 0))),
        priceAdjustment: v.priceAdjustment || 0,
        attributes: v.attributes || {},
      })),
    }));
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await apiClient.get<Product>(`/inventory/products/${id}`);
    return res.data;
  },

  createProduct: async (data: ProductCreateRequest): Promise<Product> => {
    const res = await apiClient.post<Product>('/inventory/products', data);
    return res.data;
  },

  addVariant: async (productId: number, variant: any): Promise<ProductVariant> => {
    const res = await apiClient.post<ProductVariant>(`/inventory/products/${productId}/variants`, variant);
    return res.data;
  },

  updateStock: async (variantId: number, amount: number): Promise<ProductVariant> => {
    const res = await apiClient.patch<ProductVariant>(`/inventory/variants/${variantId}/stock`, { amount });
    return res.data;
  },

  reserveStock: async (variantId: number, quantity: number): Promise<ProductVariant> => {
    const res = await apiClient.post<ProductVariant>(`/inventory/variants/${variantId}/reserve?quantity=${quantity}`);
    return res.data;
  },

  releaseReserve: async (variantId: number, quantity: number): Promise<ProductVariant> => {
    const res = await apiClient.post<ProductVariant>(`/inventory/variants/${variantId}/release-reserve?quantity=${quantity}`);
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/inventory/categories');
    return Array.isArray(res.data) ? res.data : [];
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const res = await apiClient.post<Category>('/inventory/categories', category);
    return res.data;
  },
};
