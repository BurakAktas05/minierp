import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  BookmarkPlus,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { Product, ProductVariant, Category, ProductCreateRequest } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Dialog } from '../components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { JsonViewer } from '../components/common/JsonViewer';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Collapsed / Expanded state per product
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});

  // Quick Stock Adjustment Dialog
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustmentAmount, setStockAdjustmentAmount] = useState<number>(10);
  const [stockActionType, setStockActionType] = useState<'ADD' | 'SUBTRACT' | 'RESERVE'>('ADD');

  // New Product Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBasePrice, setNewBasePrice] = useState<number>(350);
  const [newCategoryId, setNewCategoryId] = useState<number>(1);
  const [attributeRows, setAttributeRows] = useState<Array<{ key: string; value: string }>>([
    { key: 'kumas', value: 'Pamuklu' },
    { key: 'sezon', value: '2026 İlkbahar' },
  ]);
  const [variantRows, setVariantRows] = useState<
    Array<{ size: string; color: string; sku: string; initialStock: number }>
  >([
    { size: 'M', color: 'Siyah', sku: 'PRD-M-BLK', initialStock: 50 },
    { size: 'L', color: 'Siyah', sku: 'PRD-L-BLK', initialStock: 50 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodList, catList] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
      ]);
      setProducts(prodList);
      setCategories(catList);
      // Default expand first product
      if (prodList.length > 0) {
        setExpandedProducts({ [prodList[0].id]: true });
      }
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (productId: number) => {
    setExpandedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleOpenStockModal = (
    variant: ProductVariant,
    type: 'ADD' | 'SUBTRACT' | 'RESERVE'
  ) => {
    setSelectedVariant(variant);
    setStockActionType(type);
    setStockAdjustmentAmount(10);
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    try {
      if (stockActionType === 'RESERVE') {
        await inventoryApi.reserveStock(selectedVariant.id, Number(stockAdjustmentAmount));
      } else {
        const delta =
          stockActionType === 'ADD'
            ? Number(stockAdjustmentAmount)
            : -Number(stockAdjustmentAmount);
        await inventoryApi.updateStock(selectedVariant.id, delta);
      }
      setStockModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Stok işlemi başarısız: ' + (err.message || 'Hata'));
    }
  };

  // Add attribute row
  const addAttributeRow = () => {
    setAttributeRows([...attributeRows, { key: '', value: '' }]);
  };

  // Add variant row
  const addVariantRow = () => {
    setVariantRows([
      ...variantRows,
      { size: 'S', color: 'Beyaz', sku: `${newCode || 'PRD'}-${variantRows.length + 1}`, initialStock: 25 },
    ]);
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    // Convert attributes to JSONB record
    const attributesRecord: Record<string, string> = {};
    attributeRows.forEach((r) => {
      if (r.key.trim()) {
        attributesRecord[r.key.trim()] = r.value.trim();
      }
    });

    const payload: ProductCreateRequest = {
      code: newCode,
      name: newName,
      description: newDescription,
      basePrice: Number(newBasePrice),
      categoryId: Number(newCategoryId),
      attributes: attributesRecord,
      variants: variantRows.map((v) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        initialStock: Number(v.initialStock),
        priceAdjustment: 0,
      })),
    };

    try {
      await inventoryApi.createProduct(payload);
      setIsCreateModalOpen(false);
      // Reset
      setNewCode('');
      setNewName('');
      setNewDescription('');
      await loadData();
    } catch (err: any) {
      alert('Ürün oluşturulurken hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || String(p.categoryId) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Stok & Varyant Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            JSONB dinamik alanları, varyant matrisi ve anlık rezerve stok takip tablosu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Ürün Kartı</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı, stok kodu veya varyant SKU ara..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products and Nested Variants Table */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const isExpanded = !!expandedProducts[product.id];
          const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);
          const totalReserved = product.variants.reduce((s, v) => s + v.reservedStock, 0);
          const totalAvailable = product.variants.reduce((s, v) => s + v.availableStock, 0);

          return (
            <Card key={product.id} className="overflow-hidden border border-slate-200">
              {/* Product Summary Header Bar */}
              <div
                onClick={() => toggleExpand(product.id)}
                className="p-4 bg-white hover:bg-slate-50/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-900" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {product.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                      {product.categoryName && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                    )}
                    {/* Dynamic JSONB attributes */}
                    <div className="mt-2">
                      <JsonViewer data={product.attributes} />
                    </div>
                  </div>
                </div>

                {/* Stock Stats Strip */}
                <div className="flex items-center gap-6 self-end md:self-center font-mono text-xs">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                      Baz Fiyat
                    </p>
                    <p className="font-bold text-slate-900">
                      ₺{product.basePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                      Fiili Stok
                    </p>
                    <p className="font-semibold text-slate-800">{totalStock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-amber-600 font-sans uppercase font-bold">
                      Rezerve Stok
                    </p>
                    <p className="font-semibold text-amber-700">{totalReserved}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                      Kullanılabilir
                    </p>
                    <p
                      className={`font-bold px-2 py-0.5 rounded ${
                        totalAvailable <= 10
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {totalAvailable}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nested Variants Table */}
              {isExpanded && (
                <div className="bg-slate-50/50 p-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" /> Ürün Varyantları ({product.variants.length})
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Varyant SKU</TableHead>
                        <TableHead>Barkod</TableHead>
                        <TableHead>Beden</TableHead>
                        <TableHead>Renk</TableHead>
                        <TableHead className="text-right">Fiili Stok</TableHead>
                        <TableHead className="text-right">Rezerve (MQ)</TableHead>
                        <TableHead className="text-right">Kullanılabilir</TableHead>
                        <TableHead className="text-right">Hızlı İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant) => (
                        <TableRow key={variant.id} className="bg-white">
                          <TableCell className="font-mono text-xs font-semibold text-slate-900">
                            {variant.sku}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {variant.barcode || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-700">
                            {variant.size || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {variant.color || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {variant.stockQuantity}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-amber-700 font-semibold">
                            {variant.reservedStock}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            <span
                              className={`font-bold ${
                                variant.availableStock <= 5
                                  ? 'text-rose-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {variant.availableStock}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => handleOpenStockModal(variant, 'ADD')}
                              >
                                + Stok Girişi
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-amber-800 border-amber-300 bg-amber-50/50"
                                onClick={() => handleOpenStockModal(variant, 'RESERVE')}
                              >
                                Rezerve Et
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          );
        })}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <Package className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Ürün bulunamadı</p>
            <p className="text-xs text-slate-400 mt-1">Arama kriterlerinizi değiştirin veya yeni ürün kartı ekleyin.</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={
          stockActionType === 'RESERVE'
            ? 'Stok Rezerve Etme Testi'
            : stockActionType === 'ADD'
            ? 'Fiili Stok Girişi Yap'
            : 'Fiili Stok Çıkışı Yap'
        }
        description={`Seçili Varyant: ${selectedVariant?.sku} (${selectedVariant?.size || ''} - ${selectedVariant?.color || ''})`}
        maxWidth="sm"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <Input
            label="Miktar (Adet)"
            type="number"
            min="1"
            value={stockAdjustmentAmount}
            onChange={(e) => setStockAdjustmentAmount(Math.max(1, Number(e.target.value)))}
            required
          />

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1 font-mono">
            <p>Mevcut Fiili Stok: {selectedVariant?.stockQuantity}</p>
            <p>Mevcut Rezerve Stok: {selectedVariant?.reservedStock}</p>
            <p>Mevcut Kullanılabilir: {selectedVariant?.availableStock}</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setStockModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              İşlemi Tamamla
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create Product Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Yeni Ürün Kartı ve Varyantları Tanımla"
        description="JSONB dinamik özellikleri ve alt varyant matrisi tek seferde oluşturulacaktır."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-5">
          {/* Main Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ürün Kodu"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Örn: PRD-GOMLEK-01"
              required
            />
            <Input
              label="Ürün Adı"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Örn: İtalyan Yaka Slim Fit Gömlek"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Baz Fiyat (TL)"
              type="number"
              step="0.01"
              value={newBasePrice}
              onChange={(e) => setNewBasePrice(Number(e.target.value))}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Açıklama / Notlar"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Kumaş dokusu, kalıp ve bakım detayları..."
          />

          {/* Dynamic JSONB Attributes Section */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-600" /> JSONB Dinamik Nitelikler (Kumaş, Sezon vb.)
              </span>
              <button
                type="button"
                onClick={addAttributeRow}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nitelik Ekle
              </button>
            </div>
            <div className="space-y-2">
              {attributeRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Alan adı (Örn: kumas, kesim)"
                    value={row.key}
                    onChange={(e) => {
                      const updated = [...attributeRows];
                      updated[idx].key = e.target.value;
                      setAttributeRows(updated);
                    }}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Değer (Örn: %100 Keten)"
                    value={row.value}
                    onChange={(e) => {
                      const updated = [...attributeRows];
                      updated[idx].value = e.target.value;
                      setAttributeRows(updated);
                    }}
                    className="text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setAttributeRows(attributeRows.filter((_, i) => i !== idx))}
                    className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1"
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variant Generation Matrix */}
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" /> Varyantlar & Başlangıç Stokları
              </span>
              <button
                type="button"
                onClick={addVariantRow}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Varyant Ekle
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {variantRows.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].sku = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs font-mono"
                  />
                  <Input
                    placeholder="Beden"
                    value={v.size}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].size = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs w-24"
                  />
                  <Input
                    placeholder="Renk"
                    value={v.color}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].color = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs w-28"
                  />
                  <Input
                    type="number"
                    placeholder="Stok"
                    value={v.initialStock}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].initialStock = Number(e.target.value);
                      setVariantRows(updated);
                    }}
                    className="text-xs w-24"
                  />
                  <button
                    type="button"
                    onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))}
                    className="text-xs text-rose-600 hover:text-rose-800 px-2"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Ürün Kartını Kaydet
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
