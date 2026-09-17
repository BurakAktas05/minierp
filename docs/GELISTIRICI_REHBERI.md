# MiniERP Frontend Geliştirici & Tasarım Düzenleme Rehberi

Bu rehber, frontend üzerinde **yeni sayfalar, yeni tablolar, yeni kolonlar veya form alanları eklemenizi** en basit ve hızlı şekilde yapabilmeniz için hazırlanmıştır.

---

## 1. Klasör Mimarisi (Nerede Ne Var?)

```text
frontend/src/
├── api/             # Backend REST API çağrıları (Axios servisleri)
├── components/
│   ├── layout/      # Sidebar (Menü), Header (Üst Bar), AppLayout
│   ├── ui/          # Sade, tekrar kullanılabilir buton, input, kart, tablo, modal bileşenleri
│   └── common/      # Durum rozetleri (StatusBadge), metrik kartları (StatCard)
├── pages/           # Tüm ekran sayfaları (Inventory, Orders, Partners vb.)
├── types/           # TypeScript arayüz ve veri modelleri (Product, Order vb.)
└── App.tsx          # Sayfa yönlendirmeleri (Routing)
```

---

## 2. Sıfırdan Yeni Bir Sayfa Eklemek (3 Adım)

### Adım 1: `frontend/src/pages/` Altında Sayfa Dosyasını Oluşturun
Örn: `DepoPage.tsx`:

```tsx
import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Plus } from 'lucide-react';

export const DepoPage: React.FC = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Ana Merkez Depo', location: 'İstanbul / Tuzla' },
    { id: 2, name: 'Ege Lojistik Depo', location: 'İzmir / Kemalpaşa' },
  ]);

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyon */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Depo Yönetimi</h1>
        <Button variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          <span>Yeni Depo Ekle</span>
        </Button>
      </div>

      {/* Tablo Listesi */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Depo Adı</TableHead>
              <TableHead>Konum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.name}</TableCell>
                <TableCell>{item.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
```

---

### Adım 2: `App.tsx` Dosyasına Route Ekleyin
`frontend/src/App.tsx` dosyasında `Route` listesine ekleyin:

```tsx
import { DepoPage } from './pages/DepoPage';

// Routes içinde:
<Route path="/warehouses" element={<DepoPage />} />
```

---

### Adım 3: `Sidebar.tsx` Menüsüne Ekleyin
`frontend/src/components/layout/Sidebar.tsx` dosyasındaki `navItems` dizisine 1 satır ekleyin:

```tsx
import { Warehouse } from 'lucide-react';

const navItems = [
  // ... diğer sayfalar
  { name: 'Depolar', path: '/warehouses', icon: Warehouse },
];
```

İşte bu kadar! Yeni sayfanız menüde ve rotada hazır.

---

## 3. Tablolara Yeni Kolon Eklemek

Herhangi bir sayfadaki tabloya yeni bir kolon eklemek için sadece **2 yere** ekleme yapmanız yeterlidir:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Ürün Adı</TableHead>
      <TableHead>Fiyat</TableHead>
      {/* 1. YENİ KOLON BAŞLIĞI BURAYA: */}
      <TableHead>Stok Durumu</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>₺{item.price}</TableCell>
        {/* 2. YENİ KOLON DEĞERİ BURAYA: */}
        <TableCell>{item.stock} Adet</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 4. Modal (Açılır Pencere / Form) Eklemek

Kullanıcıdan veri almak veya ekleme formu açmak için hazır `<Dialog>` bileşeni:

```tsx
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

// 1. State:
const [isOpen, setIsOpen] = useState(false);
const [name, setName] = useState('');

// 2. JSX:
<Dialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Yeni Kayıt Oluştur"
  description="Lütfen bilgileri eksiksiz doldurunuz."
  maxWidth="md"
>
  <form onSubmit={handleSave} className="space-y-4">
    <Input
      label="Kayıt Adı"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Örn: Değer giriniz..."
      required
    />
    
    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
      <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
        Vazgeç
      </Button>
      <Button variant="primary" type="submit">
        Kaydet
      </Button>
    </div>
  </form>
</Dialog>
```

---

## 5. Hazır UI Bileşenleri Hızlı Başvuru

| Bileşen | Kullanım Amacı | Örnek |
|---|---|---|
| `<Button>` | Birincil, ikincil veya silme butonları | `<Button variant="primary">Kaydet</Button>` |
| `<Input>` | Etiketli ve hata mesajlı metin alanı | `<Input label="Ad" value={val} onChange={...} />` |
| `<Select>` | Açılır liste seçim kutusu | `<Select label="Rol" options={[{value: '1', label: 'Admin'}]} />` |
| `<Card>` | Beyaz arkaplanlı şık kutu konteyner | `<Card><CardHeader>...</CardHeader></Card>` |
| `<Table>` | Otomatik responsive liste tablosu | `<Table><TableHeader>...<TableBody>...</Table>` |
| `<Badge>` | Renkli durum etiketi (Başarılı, İptal vb.) | `<Badge variant="success">Aktif</Badge>` |
| `<Dialog>` | Açılır modal penceresi | `<Dialog isOpen={true} onClose={...} title="...">` |
