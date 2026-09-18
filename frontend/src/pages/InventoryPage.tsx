import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Layers,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  BookmarkPlus,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { useToast } from '../context/ToastContext';
import { Product, ProductVariant, Category, ProductCreateRequest } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';
import { JsonViewer } from '../components/common/JsonViewer';

const formatCurrency = (amount: number = 0) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

export interface FlattenedVariantItem extends ProductVariant {
  productId: number;
  productCode: string;
  productName: string;
  categoryName?: string;
  basePrice: number;
  productAttributes?: Record<string, any>;
}

export const InventoryPage: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Görünüm Modu: 'SKU' = Düz Varyant Listesi, 'PRODUCT' = Ana Ürün Kartları
  const [viewMode, setViewMode] = useState<'SKU' | 'PRODUCT'>('SKU');

  // Filtreler
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Seçili satır durumu
  const [selectedVariant, setSelectedVariant] = useState<FlattenedVariantItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modallar
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [addVariantModalOpen, setAddVariantModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Stok Düzeltme Formu
  const [stockActionType, setStockActionType] = useState<'ADD' | 'SUBTRACT' | 'RESERVE' | 'RELEASE'>('ADD');
  const [stockAdjustmentAmount, setStockAdjustmentAmount] = useState<number>(10);

  // Yeni Ürün Formu Durumu
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
    Array<{ size: string; color: string; sku: string; barcode: string; initialStock: number }>
  >([
    { size: 'M', color: 'Siyah', sku: 'PRD-M-BLK', barcode: '8690001001', initialStock: 50 },
    { size: 'L', color: 'Siyah', sku: 'PRD-L-BLK', barcode: '8690001002', initialStock: 50 },
  ]);

  // Yeni Varyant Formu Durumu
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantBarcode, setNewVariantBarcode] = useState('');
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantPurchasePrice, setNewVariantPurchasePrice] = useState<number>(150);
  const [newVariantSalePrice, setNewVariantSalePrice] = useState<number>(250);
  const [newVariantStock, setNewVariantStock] = useState<number>(20);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodList, catList] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getCategories(),
      ]);
      setProducts(prodList);
      setCategories(catList);

      if (catList.length > 0 && newCategoryId === 1 && !catList.some((c) => c.id === 1)) {
        setNewCategoryId(catList[0].id);
      }

      // Seçimi koru
      if (selectedProduct) {
        const updatedP = prodList.find((p) => p.id === selectedProduct.id);
        setSelectedProduct(updatedP || null);
      }
      if (selectedVariant) {
        const flatList = prodList.flatMap((p) =>
          p.variants.map((v) => ({
            ...v,
            productId: p.id,
            productCode: p.code,
            productName: p.name,
            categoryName: p.categoryName,
            basePrice: p.basePrice,
            productAttributes: p.attributes,
          }))
        );
        const updatedV = flatList.find((v) => v.id === selectedVariant.id);
        setSelectedVariant(updatedV || null);
      }
    } catch (err) {
      console.error('Stok verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tüm varyantları ana ürün bilgileriyle düzleştir
  const allFlattenedVariants = useMemo<FlattenedVariantItem[]>(() => {
    return products.flatMap((p) =>
      p.variants.map((v) => ({
        ...v,
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        categoryName: p.categoryName,
        basePrice: p.basePrice,
        productAttributes: p.attributes,
      }))
    );
  }, [products]);

  // Filtrelenmiş SKU listesi
  const filteredVariants = useMemo(() => {
    return allFlattenedVariants.filter((v) => {
      // Kategori filtresi
      if (selectedCategory !== 'ALL') {
        const prod = products.find((p) => p.id === v.productId);
        if (prod && String(prod.categoryId) !== selectedCategory) return false;
      }

      // Durum sekmeleri
      if (activeTab === 'IN_STOCK' && v.stockQuantity <= 0) return false;
      if (activeTab === 'OUT_OF_STOCK' && v.stockQuantity > 0) return false;

      // Arama terimi filtresi
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          v.sku.toLowerCase().includes(term) ||
          v.productName.toLowerCase().includes(term) ||
          v.productCode.toLowerCase().includes(term) ||
          (v.barcode && v.barcode.toLowerCase().includes(term)) ||
          (v.size && v.size.toLowerCase().includes(term)) ||
          (v.color && v.color.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [allFlattenedVariants, products, selectedCategory, activeTab, searchTerm]);

  // Filtrelenmiş ana ürün listesi (Ürün Kartları modu için)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && String(p.categoryId) !== selectedCategory) return false;

      const totalPhysical = p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);

      if (activeTab === 'IN_STOCK' && totalPhysical <= 0) return false;
      if (activeTab === 'OUT_OF_STOCK' && totalPhysical > 0) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          p.code.toLowerCase().includes(term) ||
          p.name.toLowerCase().includes(term) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [products, selectedCategory, activeTab, searchTerm]);

  // Finansal ve stok özet metrikleri
  const summaryMetrics = useMemo(() => {
    const list = filteredVariants;
    const totalPhysical = list.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    const totalReserved = list.reduce((sum, v) => sum + (v.reservedStock || 0), 0);
    const totalAvailable = list.reduce((sum, v) => sum + (v.availableStock || 0), 0);
    const totalValuation = list.reduce(
      (sum, v) => sum + (v.stockQuantity || 0) * (v.basePrice || 0),
      0
    );

    return { totalPhysical, totalReserved, totalAvailable, totalValuation };
  }, [filteredVariants]);

  // Hızlı stok hareketi modalını aç
  const handleOpenStockModal = (type: 'ADD' | 'SUBTRACT' | 'RESERVE' | 'RELEASE') => {
    if (!selectedVariant) {
      toast.warning('Lütfen stok işlemi yapmak istediğiniz satırı seçiniz.');
      return;
    }
    setStockActionType(type);
    setStockAdjustmentAmount(10);
    setStockModalOpen(true);
  };

  // Stok hareketi kaydet
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    try {
      if (stockActionType === 'RESERVE') {
        await inventoryApi.reserveStock(selectedVariant.id, Number(stockAdjustmentAmount));
      } else if (stockActionType === 'RELEASE') {
        await inventoryApi.releaseReserve(selectedVariant.id, Number(stockAdjustmentAmount));
      } else {
        const delta =
          stockActionType === 'ADD'
            ? Number(stockAdjustmentAmount)
            : -Number(stockAdjustmentAmount);
        await inventoryApi.updateStock(selectedVariant.id, delta);
      }
      toast.success('Stok hareketi başarıyla işlendi.');
      setStockModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Stok işlemi başarısız: ' + (err.response?.data?.message || err.message || 'Hata'));
    }
  };

  // Yeni varyant modalını aç
  const handleOpenAddVariant = () => {
    const targetProduct =
      selectedProduct ||
      (selectedVariant ? products.find((p) => p.id === selectedVariant.productId) : null);

    if (!targetProduct) {
      toast.warning('Lütfen önce varyant eklemek istediğiniz ürün kartını seçiniz.');
      return;
    }

    setSelectedProduct(targetProduct);
    const variantIndex = targetProduct.variants.length + 1;
    setNewVariantSku(`${targetProduct.code}-VAR-${variantIndex}`);
    setNewVariantName(`${targetProduct.name} - Varyant ${variantIndex}`);
    setNewVariantBarcode(`869${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNewVariantSize('L');
    setNewVariantColor('Mavi');
    setNewVariantPurchasePrice(Math.round(targetProduct.basePrice * 0.6));
    setNewVariantSalePrice(targetProduct.basePrice);
    setNewVariantStock(25);
    setAddVariantModalOpen(true);
  };

  // Yeni varyant kaydet
  const handleAddVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newVariantSku || !newVariantName) return;

    try {
      await inventoryApi.addVariant(selectedProduct.id, {
        sku: newVariantSku.toUpperCase(),
        variantName: newVariantName,
        barcode: newVariantBarcode || undefined,
        purchasePrice: Number(newVariantPurchasePrice),
        salePrice: Number(newVariantSalePrice),
        stockQuantity: Number(newVariantStock),
        attributes: {
          beden: newVariantSize,
          renk: newVariantColor,
        },
      });
      toast.success(`'${newVariantSku}' varyantı başarıyla eklendi.`);
      setAddVariantModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Varyant eklenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Yeni ürün kartı kaydet
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const attributesRecord: Record<string, string> = {};
    attributeRows.forEach((r) => {
      if (r.key.trim()) {
        attributesRecord[r.key.trim()] = r.value.trim();
      }
    });

    const payload: ProductCreateRequest = {
      code: newCode.toUpperCase(),
      name: newName,
      description: newDescription,
      basePrice: Number(newBasePrice),
      categoryId: Number(newCategoryId),
      attributes: attributesRecord,
      variants: variantRows.map((v) => ({
        sku: v.sku.toUpperCase(),
        barcode: v.barcode,
        size: v.size,
        color: v.color,
        initialStock: Number(v.initialStock),
        priceAdjustment: 0,
      })),
    };

    try {
      await inventoryApi.createProduct(payload);
      toast.success('Ürün kartı ve başlangıç varyantları sisteme kaydedildi.');
      setCreateProductModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDescription('');
      await loadData();
    } catch (err: any) {
      toast.error('Ürün oluşturulurken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // SKU / Varyant Düz Liste Tablo Sütunları
  const skuColumns: Column<FlattenedVariantItem>[] = [
    {
      id: 'productCode',
      header: 'Ürün Kodu',
      width: '130px',
      accessor: (v) => <span className="font-mono font-bold text-slate-800">{v.productCode}</span>,
    },
    {
      id: 'productName',
      header: 'Ürün / Malzeme Adı',
      accessor: (v) => (
        <div>
          <div className="font-semibold text-slate-900 text-xs">{v.productName}</div>
          {v.categoryName && (
            <span className="text-[10px] text-slate-500 font-medium">{v.categoryName}</span>
          )}
        </div>
      ),
    },
    {
      id: 'sku',
      header: 'Varyant SKU',
      width: '150px',
      accessor: (v) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          {v.sku}
        </span>
      ),
    },
    {
      id: 'barcode',
      header: 'Barkod',
      width: '120px',
      accessor: (v) => <span className="font-mono text-slate-500">{v.barcode || '-'}</span>,
    },
    {
      id: 'variantAttributes',
      header: 'Beden / Renk',
      width: '130px',
      accessor: (v) => (
        <span className="text-slate-700 font-medium">
          {v.size || '-'} {v.color ? `/ ${v.color}` : ''}
        </span>
      ),
    },
    {
      id: 'stockQuantity',
      header: 'Fiili Stok',
      width: '90px',
      align: 'right',
      accessor: (v) => (
        <span className="font-mono font-semibold text-slate-800">{v.stockQuantity}</span>
      ),
    },
    {
      id: 'reservedStock',
      header: 'Rezerve',
      width: '90px',
      align: 'right',
      accessor: (v) => (
        <span
          className={`font-mono font-semibold ${
            v.reservedStock > 0 ? 'text-amber-700' : 'text-slate-400'
          }`}
        >
          {v.reservedStock}
        </span>
      ),
    },
    {
      id: 'availableStock',
      header: 'Kullanılabilir',
      width: '100px',
      align: 'right',
      accessor: (v) => (
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded ${
            v.availableStock <= 0
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : v.availableStock <= 5
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {v.availableStock}
        </span>
      ),
    },
    {
      id: 'basePrice',
      header: 'Baz Satış',
      width: '110px',
      align: 'right',
      accessor: (v) => (
        <span className="font-mono text-slate-900 font-semibold">
          {formatCurrency(v.basePrice + (v.priceAdjustment || 0))}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Stok Durumu',
      width: '110px',
      align: 'center',
      accessor: (v) => {
        if (v.availableStock <= 0) {
          return <StatusBadge status="Tükendi" type="danger" />;
        }
        if (v.availableStock <= 5) {
          return <StatusBadge status="Kritik" type="warning" />;
        }
        return <StatusBadge status="Yeterli" type="success" />;
      },
    },
  ];

  // Ana Ürün Kartları Tablo Sütunları
  const productColumns: Column<Product>[] = [
    {
      id: 'code',
      header: 'Stok Kodu',
      width: '150px',
      accessor: (p) => <span className="font-mono font-bold text-slate-900">{p.code}</span>,
    },
    {
      id: 'name',
      header: 'Malzeme / Ürün Adı',
      accessor: (p) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{p.name}</div>
          {p.description && <div className="text-[11px] text-slate-500">{p.description}</div>}
        </div>
      ),
    },
    {
      id: 'categoryName',
      header: 'Kategori',
      width: '140px',
      accessor: (p) => (
        <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {p.categoryName || '-'}
        </span>
      ),
    },
    {
      id: 'variantCount',
      header: 'Varyant',
      width: '80px',
      align: 'center',
      accessor: (p) => (
        <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
          {p.variants.length} SKU
        </span>
      ),
    },
    {
      id: 'totalPhysical',
      header: 'Toplam Fiili',
      width: '100px',
      align: 'right',
      accessor: (p) => (
        <span className="font-mono font-semibold text-slate-800">
          {p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)}
        </span>
      ),
    },
    {
      id: 'totalReserved',
      header: 'Top. Rezerve',
      width: '100px',
      align: 'right',
      accessor: (p) => {
        const res = p.variants.reduce((sum, v) => sum + (v.reservedStock || 0), 0);
        return (
          <span className={`font-mono font-semibold ${res > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {res}
          </span>
        );
      },
    },
    {
      id: 'totalAvailable',
      header: 'Kullanılabilir',
      width: '110px',
      align: 'right',
      accessor: (p) => {
        const avail = p.variants.reduce((sum, v) => sum + (v.availableStock || 0), 0);
        return (
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded ${
              avail <= 5
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {avail}
          </span>
        );
      },
    },
    {
      id: 'basePrice',
      header: 'Baz Fiyat',
      width: '110px',
      align: 'right',
      accessor: (p) => (
        <span className="font-mono font-semibold text-slate-900">{formatCurrency(p.basePrice)}</span>
      ),
    },
    {
      id: 'attributes',
      header: 'JSONB Özellikler',
      width: '160px',
      accessor: (p) => (
        <div className="truncate max-w-[150px] font-mono text-[10px] text-slate-600">
          {p.attributes ? JSON.stringify(p.attributes) : '-'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="Stok & Malzeme Kartları"
        subtitle="Dinamik Varyant Matrisi & Rezerve Stok Takip Tablosu"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Ürün adı, stok kodu, SKU veya barkod ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Ürün Kartı',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => setCreateProductModalOpen(true),
            variant: 'primary',
          },
          {
            label: 'Varyant Ekle',
            icon: <Layers className="w-3.5 h-3.5 text-indigo-600" />,
            onClick: handleOpenAddVariant,
            disabled: !selectedProduct && !selectedVariant,
            title: 'Seçili ana ürün kartına yeni bir SKU / Varyant ekler',
          },
          {
            label: '+ Stok Girişi',
            icon: <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />,
            onClick: () => handleOpenStockModal('ADD'),
            disabled: !selectedVariant,
            title: 'Seçili varyant için fiili stok artışı yapar',
          },
          {
            label: '- Stok Çıkışı',
            icon: <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />,
            onClick: () => handleOpenStockModal('SUBTRACT'),
            disabled: !selectedVariant,
            title: 'Seçili varyant için fiili stok düşüşü yapar',
          },
          {
            label: 'Kartı İncele / JSONB',
            icon: <Eye className="w-3.5 h-3.5 text-blue-600" />,
            onClick: () => {
              if (!selectedVariant && !selectedProduct) {
                toast.warning('Lütfen incelemek istediğiniz stok kartını seçiniz.');
                return;
              }
              setDetailModalOpen(true);
            },
            disabled: !selectedVariant && !selectedProduct,
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => window.print(),
          },
        ]}
      >
        {/* Left Side: Category Selector & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('SKU')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'SKU'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Varyant & SKU Izgarası
            </button>
            <button
              onClick={() => setViewMode('PRODUCT')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer border-l border-slate-300 ${
                viewMode === 'PRODUCT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Ana Stok Kartları
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Quick Filter Status Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'ALL', label: 'Tüm Stoklar' },
              { id: 'IN_STOCK', label: 'Stokta Bulunanlar' },
              { id: 'OUT_OF_STOCK', label: 'Tükenenler (0)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </ErpToolbar>

      {/* 2. DİA ERP Veri Izgarası (Data Grid) */}
      {viewMode === 'SKU' ? (
        <ErpDataGrid
          data={filteredVariants}
          columns={skuColumns}
          keyExtractor={(v) => v.id}
          selectedId={selectedVariant?.id}
          onSelectRow={(v) => {
            setSelectedVariant(v);
            const p = products.find((prod) => prod.id === v.productId);
            setSelectedProduct(p || null);
          }}
          onDoubleClickRow={(v) => {
            setSelectedVariant(v);
            const p = products.find((prod) => prod.id === v.productId);
            setSelectedProduct(p || null);
            setDetailModalOpen(true);
          }}
          loading={loading}
          emptyMessage="Kriterlere uygun varyant kaydı bulunamadı."
        />
      ) : (
        <ErpDataGrid
          data={filteredProducts}
          columns={productColumns}
          keyExtractor={(p) => p.id}
          selectedId={selectedProduct?.id}
          onSelectRow={(p) => {
            setSelectedProduct(p);
            if (p.variants.length > 0) {
              setSelectedVariant(allFlattenedVariants.find((v) => v.productId === p.id) || null);
            } else {
              setSelectedVariant(null);
            }
          }}
          onDoubleClickRow={(p) => {
            setSelectedProduct(p);
            setDetailModalOpen(true);
          }}
          loading={loading}
          emptyMessage="Kriterlere uygun ürün kartı bulunamadı."
        />
      )}

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={viewMode === 'SKU' ? filteredVariants.length : filteredProducts.length}
        selectedText={
          selectedVariant
            ? `Seçili SKU: ${selectedVariant.sku} (${selectedVariant.productName}) | Mevcut Stok: ${selectedVariant.stockQuantity}`
            : selectedProduct
            ? `Seçili Kart: ${selectedProduct.code} - ${selectedProduct.name} (${selectedProduct.variants.length} Varyant)`
            : undefined
        }
        metrics={[
          { label: 'Toplam Fiili Stok', value: `${summaryMetrics.totalPhysical.toLocaleString('tr-TR')} Adet` },
          {
            label: 'Toplam Stok Değeri',
            value: formatCurrency(summaryMetrics.totalValuation),
            highlight: 'success',
          },
        ]}
      />

      {/* MODAL 1: Hızlı Stok Hareketi (Giriş / Çıkış / Rezerve / Bırak) */}
      <Dialog
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={
          stockActionType === 'RESERVE'
            ? 'Stok Rezerve Etme Testi (RabbitMQ)'
            : stockActionType === 'RELEASE'
            ? 'Rezerve Stoğu Serbest Bırak'
            : stockActionType === 'ADD'
            ? 'Fiili Stok Girişi (+)'
            : 'Fiili Stok Çıkışı (-)'
        }
        description={`Seçili Varyant: ${selectedVariant?.sku} (${selectedVariant?.productName})`}
        maxWidth="sm"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <Input
            label="İşlem Miktarı (Adet)"
            type="number"
            min="1"
            value={stockAdjustmentAmount}
            onChange={(e) => setStockAdjustmentAmount(Math.max(1, Number(e.target.value)))}
            required
          />

          <div className="rounded border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Mevcut Fiili Stok:</span>
              <span className="font-bold">{selectedVariant?.stockQuantity} Adet</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>Mevcut Rezerve Stok:</span>
              <span className="font-bold">{selectedVariant?.reservedStock} Adet</span>
            </div>
            <div className="flex justify-between text-emerald-700 border-t border-slate-200 pt-1">
              <span>Mevcut Kullanılabilir:</span>
              <span className="font-bold">{selectedVariant?.availableStock} Adet</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setStockModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              type="submit"
              variant={stockActionType === 'SUBTRACT' ? 'destructive' : 'primary'}
            >
              İşlemi Onayla
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Yeni Varyant Ekleme Modalı */}
      <Dialog
        isOpen={addVariantModalOpen}
        onClose={() => setAddVariantModalOpen(false)}
        title={`Ürüne Yeni Varyant / SKU Ekle — ${selectedProduct?.name || ''}`}
        description={`Stok Kodu: ${selectedProduct?.code || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddVariantSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Varyant SKU"
              value={newVariantSku}
              onChange={(e) => setNewVariantSku(e.target.value.toUpperCase())}
              placeholder="Örn: PRD-XL-RED"
              required
            />
            <Input
              label="Barkod (EAN/UPC)"
              value={newVariantBarcode}
              onChange={(e) => setNewVariantBarcode(e.target.value)}
              placeholder="869..."
            />
          </div>

          <Input
            label="Varyant Adı / Tanımı"
            value={newVariantName}
            onChange={(e) => setNewVariantName(e.target.value)}
            placeholder="Örn: Kırmızı - XL"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Beden / Ölçü"
              value={newVariantSize}
              onChange={(e) => setNewVariantSize(e.target.value)}
              placeholder="Örn: XL, 42, 100ml"
            />
            <Input
              label="Renk"
              value={newVariantColor}
              onChange={(e) => setNewVariantColor(e.target.value)}
              placeholder="Örn: Kırmızı, Lacivert"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Alış Fiyatı (TL)"
              type="number"
              step="0.01"
              value={newVariantPurchasePrice}
              onChange={(e) => setNewVariantPurchasePrice(Number(e.target.value))}
              required
            />
            <Input
              label="Satış Fiyatı (TL)"
              type="number"
              step="0.01"
              value={newVariantSalePrice}
              onChange={(e) => setNewVariantSalePrice(Number(e.target.value))}
              required
            />
            <Input
              label="Başlangıç Stoğu"
              type="number"
              value={newVariantStock}
              onChange={(e) => setNewVariantStock(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setAddVariantModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Varyantı Kaydet
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Yeni Ana Ürün Kartı Tanımlama */}
      <Dialog
        isOpen={createProductModalOpen}
        onClose={() => setCreateProductModalOpen(false)}
        title="Yeni Malzeme / Stok Kartı Tanımla"
        description="JSONB dinamik nitelikleri ve başlangıç varyant matrisi"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Stok / Malzeme Kodu"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Örn: STK-KAZAK-01"
              required
            />
            <Input
              label="Ürün / Malzeme Adı"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Örn: Boğazlı Yün Triko Kazak"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Baz Satış Fiyatı (TL)"
              type="number"
              step="0.01"
              value={newBasePrice}
              onChange={(e) => setNewBasePrice(Number(e.target.value))}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(Number(e.target.value))}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Açıklama / Notlar"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Malzeme tipi, saklama koşulları, menşei..."
          />

          {/* JSONB Dynamic Attributes */}
          <div className="rounded border border-slate-300 p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> JSONB Dinamik Özellikler (Kumaş, Sezon, Kesim vb.)
              </span>
              <button
                type="button"
                onClick={() => setAttributeRows([...attributeRows, { key: '', value: '' }])}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Özellik Ekle
              </button>
            </div>
            <div className="space-y-1.5">
              {attributeRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Alan adı (Örn: kumas)"
                    value={row.key}
                    onChange={(e) => {
                      const updated = [...attributeRows];
                      updated[idx].key = e.target.value;
                      setAttributeRows(updated);
                    }}
                    className="text-xs font-mono"
                  />
                  <Input
                    placeholder="Değer (Örn: %100 Yün)"
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
                    className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1 cursor-pointer"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Initial Variants Matrix */}
          <div className="rounded border border-slate-300 p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Başlangıç Varyantları ({variantRows.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setVariantRows([
                    ...variantRows,
                    {
                      size: 'XL',
                      color: 'Siyah',
                      sku: `${newCode || 'PRD'}-${variantRows.length + 1}`,
                      barcode: `869${Math.floor(1000000 + Math.random() * 9000000)}`,
                      initialStock: 25,
                    },
                  ])
                }
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Varyant Ekle
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                    className="text-xs font-mono w-36"
                  />
                  <Input
                    placeholder="Barkod"
                    value={v.barcode}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].barcode = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs font-mono w-28"
                  />
                  <Input
                    placeholder="Beden"
                    value={v.size}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].size = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs w-20"
                  />
                  <Input
                    placeholder="Renk"
                    value={v.color}
                    onChange={(e) => {
                      const updated = [...variantRows];
                      updated[idx].color = e.target.value;
                      setVariantRows(updated);
                    }}
                    className="text-xs w-24"
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
                    className="text-xs w-20"
                  />
                  <button
                    type="button"
                    onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))}
                    className="text-xs text-rose-600 hover:text-rose-800 px-2 cursor-pointer"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateProductModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Stok Kartını Kaydet
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 4: Kart Detay ve JSONB Özellikleri Modalı */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Stok Kartı Detayı — ${selectedProduct?.name || selectedVariant?.productName || ''}`}
        description={`Stok Kodu: ${selectedProduct?.code || selectedVariant?.productCode || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block">Stok Kodu</span>
              <span className="font-mono font-bold text-slate-800">
                {selectedProduct?.code || selectedVariant?.productCode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Kategori</span>
              <span className="font-semibold text-slate-800">
                {selectedProduct?.categoryName || selectedVariant?.categoryName || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Baz Fiyat</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(selectedProduct?.basePrice || selectedVariant?.basePrice || 0)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Toplam Varyant</span>
              <span className="font-mono font-semibold text-slate-800">
                {selectedProduct?.variants.length || 1} SKU
              </span>
            </div>
          </div>

          {/* Dynamic JSONB Attributes */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> PostgreSQL JSONB Dinamik Nitelikler
            </h4>
            <div className="border border-slate-200 rounded p-2 bg-white">
              <JsonViewer data={selectedProduct?.attributes || selectedVariant?.productAttributes} />
            </div>
          </div>

          {/* Variants Table Inside Modal */}
          {selectedProduct && selectedProduct.variants.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Alt Varyantlar & Stok Dağılımı
              </h4>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">SKU</th>
                      <th className="p-2 border-r border-slate-300">Barkod</th>
                      <th className="p-2 border-r border-slate-300">Ölçü / Renk</th>
                      <th className="p-2 text-right border-r border-slate-300">Fiili</th>
                      <th className="p-2 text-right border-r border-slate-300">Rezerve</th>
                      <th className="p-2 text-right">Kullanılabilir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedProduct.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-blue-700 border-r border-slate-300">
                          {v.sku}
                        </td>
                        <td className="p-2 font-mono text-slate-500 border-r border-slate-300">
                          {v.barcode || '-'}
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          {v.size || '-'} {v.color ? `/ ${v.color}` : ''}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold border-r border-slate-300">
                          {v.stockQuantity}
                        </td>
                        <td className="p-2 text-right font-mono text-amber-700 font-semibold border-r border-slate-300">
                          {v.reservedStock}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-700">
                          {v.availableStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
