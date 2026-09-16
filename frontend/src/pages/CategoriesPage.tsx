import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, RefreshCw, Layers } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { Category, Product } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
      await loadData();
    } catch (err: any) {
      alert('Kategori eklenirken hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ürün grupları, ana ve alt kategori hiyerarşisi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yenile</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kategori Ekle</span>
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori Kodu</TableHead>
              <TableHead>Kategori Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead className="text-right">Bağlı Ürün Sayısı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const productCount = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <TableRow key={cat.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {cat.code}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {cat.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {cat.description || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                      {productCount} Ürün
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Create Category Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kategori Oluştur"
        description="Ürünlerin gruplanması ve stok raporlaması için kategori tanımlayınız."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Kategori Kodu"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="Örn: KAT-AKSESUAR"
            required
          />
          <Input
            label="Kategori Adı"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Örn: Aksesuar & Kemer"
            required
          />
          <Input
            label="Açıklama"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Kategori kapsamı..."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
