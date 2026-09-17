import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, FolderTree, Tag, Layers, Printer } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { Category, Product } from '../types';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { ErpToolbar } from '../components/common/ErpToolbar';
import { ErpDataGrid, Column } from '../components/common/ErpDataGrid';
import { ErpSummaryBar } from '../components/common/ErpSummaryBar';

export const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // New Category Dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [catList, prodList] = await Promise.all([
        inventoryApi.getCategories(),
        inventoryApi.getProducts(),
      ]);
      setCategories(catList);
      setProducts(prodList);
      if (selectedCategory) {
        const found = catList.find((c) => c.id === selectedCategory.id);
        setSelectedCategory(found || null);
      }
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    try {
      await inventoryApi.createCategory({
        code: newCode.toUpperCase(),
        name: newName,
        description: newDescription,
      });
      setIsModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDescription('');
      toast.success('Yeni kategori başarıyla eklendi.');
      await loadData();
    } catch (err: any) {
      toast.error('Kategori eklenirken hata: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          cat.code.toLowerCase().includes(term) ||
          cat.name.toLowerCase().includes(term) ||
          (cat.description && cat.description.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [categories, searchTerm]);

  // Columns definition for ErpDataGrid
  const columns: Column<Category>[] = [
    {
      id: 'code',
      header: 'Kategori Kodu',
      width: '180px',
      accessor: (cat) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {cat.code}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Kategori Adı',
      width: '240px',
      accessor: (cat) => <span className="font-semibold text-slate-800">{cat.name}</span>,
    },
    {
      id: 'description',
      header: 'Açıklama / Notlar',
      accessor: (cat) => <span className="text-slate-600">{cat.description || '-'}</span>,
    },
    {
      id: 'productCount',
      header: 'Bağlı Ürün Sayısı',
      width: '150px',
      align: 'right',
      accessor: (cat) => {
        const count = products.filter((p) => p.categoryId === cat.id).length;
        return (
          <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
            {count} Ürün
          </span>
        );
      },
    },
  ];

  const totalAssignedProducts = useMemo(() => {
    return categories.reduce((sum, cat) => {
      const count = products.filter((p) => p.categoryId === cat.id).length;
      return sum + count;
    }, 0);
  }, [categories, products]);

  return (
    <div className="space-y-0 select-none">
      {/* 1. DİA ERP Toolbar */}
      <ErpToolbar
        title="Malzeme & Ürün Grupları"
        subtitle="Stok Kategori ve Hiyerarşi Yönetimi"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Kategori kodu veya adı ara..."
        onRefresh={loadData}
        actions={[
          {
            label: 'Yeni Kategori Ekle',
            icon: <Plus className="w-3.5 h-3.5 text-white" />,
            onClick: () => setIsModalOpen(true),
            variant: 'primary',
          },
          {
            label: 'Yazdır',
            icon: <Printer className="w-3.5 h-3.5 text-slate-600" />,
            onClick: () => window.print(),
          },
        ]}
      />

      {/* 2. DİA ERP Veri Izgarası (Data Grid) */}
      <ErpDataGrid
        data={filteredCategories}
        columns={columns}
        keyExtractor={(cat) => cat.id}
        selectedId={selectedCategory?.id}
        onSelectRow={(cat) => setSelectedCategory(cat)}
        loading={loading}
        emptyMessage="Tanımlı kategori bulunamadı."
      />

      {/* 3. DİA ERP Dip Toplam Çubuğu */}
      <ErpSummaryBar
        totalCount={filteredCategories.length}
        selectedText={
          selectedCategory
            ? `Seçili Kategori: ${selectedCategory.code} - ${selectedCategory.name}`
            : undefined
        }
        metrics={[
          { label: 'Toplam Kategori', value: `${categories.length} Tanım` },
          { label: 'Kategorize Edilmiş Ürünler', value: `${totalAssignedProducts} Ürün`, highlight: 'success' },
        ]}
      />

      {/* MODAL: Yeni Kategori Ekleme */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Malzeme Kategorisi Tanımla"
        description="Ürünlerin gruplanması ve stok raporlaması için kategori kartı açınız."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Kategori Kodu"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Örn: KAT-GIYIM"
            required
          />
          <Input
            label="Kategori Adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Örn: Tekstil & Giyim"
            required
          />
          <Input
            label="Açıklama"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Kategori kapsamı ve grup detayları..."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              Kategoriyi Kaydet
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
