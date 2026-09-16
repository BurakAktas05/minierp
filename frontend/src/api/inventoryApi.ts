import { apiClient, apiRequest, mockStore } from './client';
import { Product, ProductCreateRequest, ProductVariant, Category } from '../types';

export const inventoryApi = {
  getProducts: async (): Promise<Product[]> => {
    return apiRequest(
      async () => {
        const res = await apiClient.get<any>('/inventory/products');
        const raw = res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data;
        const list = Array.isArray(raw) ? raw : [];
        const normalized: Product[] = list.map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          basePrice: p.basePrice || (p.variants && p.variants[0] ? Number(p.variants[0].salePrice) : 0),
          categoryId: p.categoryId,
          categoryName: p.categoryName || (p.category ? p.category.name : ''),
          active: p.active !== false,
          attributes: p.attributes || {},
          variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            sku: v.sku,
            barcode: v.barcode,
            size: v.size || v.attributes?.size || v.attributes?.beden || (v.variantName && v.variantName.includes('/') ? v.variantName.split('/')[0].trim() : ''),
            color: v.color || v.attributes?.color || v.attributes?.renk || (v.variantName && v.variantName.includes('/') ? v.variantName.split('/')[1].trim() : v.variantName),
            stockQuantity: Number(v.stockQuantity ?? 0),
            reservedStock: Number(v.reservedStock ?? 0),
            availableStock: Number(v.availableStock ?? (v.stockQuantity - (v.reservedStock || 0))),
            priceAdjustment: v.priceAdjustment || 0,
            attributes: v.attributes || {},
          })),
        }));
        return { data: normalized };
      },
      () => mockStore.getProducts()
    );
  },


  getProductById: async (id: number): Promise<Product> => {
    return apiRequest(
      () => apiClient.get<Product>(`/inventory/products/${id}`),
      () => {
        const p = mockStore.getProduct(id);
        if (!p) throw new Error('Ürün bulunamadı');
        return p;
      }
    );
  },

  createProduct: async (data: ProductCreateRequest): Promise<Product> => {
    return apiRequest(
      () => apiClient.post<Product>('/inventory/products', data),
      () => mockStore.addProduct(data)
    );
  },

  addVariant: async (productId: number, variant: any): Promise<ProductVariant> => {
    return apiRequest(
      () => apiClient.post<ProductVariant>(`/inventory/products/${productId}/variants`, variant),
      () => {
        const prod = mockStore.getProduct(productId);
        if (!prod) throw new Error('Ürün bulunamadı');
        const newVar: ProductVariant = {
          id: Date.now(),
          sku: variant.sku,
          barcode: variant.barcode,
          size: variant.size,
          color: variant.color,
          stockQuantity: variant.initialStock || 0,
          reservedStock: 0,
          availableStock: variant.initialStock || 0,
          priceAdjustment: variant.priceAdjustment || 0,
          attributes: variant.attributes,
        };
        prod.variants.push(newVar);
        return newVar;
      }
    );
  },

  updateStock: async (variantId: number, amount: number): Promise<ProductVariant> => {
    return apiRequest(
      () => apiClient.patch<ProductVariant>(`/inventory/variants/${variantId}/stock`, { amount }),
      () => mockStore.updateVariantStock(variantId, amount)
    );
  },

  reserveStock: async (variantId: number, quantity: number): Promise<ProductVariant> => {
    return apiRequest(
      () => apiClient.post<ProductVariant>(`/inventory/variants/${variantId}/reserve?quantity=${quantity}`),
      () => mockStore.reserveVariantStock(variantId, quantity)
    );
  },

  getCategories: async (): Promise<Category[]> => {
    return apiRequest(
      () => apiClient.get<Category[]>('/inventory/categories'),
      () => mockStore.getCategories()
    );
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    return apiRequest(
      () => apiClient.post<Category>('/inventory/categories', category),
      () => mockStore.addCategory(category)
    );
  },
};
