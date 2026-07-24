import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, Search, Edit2, X, FolderPlus, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import type { Category } from '../../types';

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, updateCategorySortOrders } = useAppStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('☕');
  const [sortOrder, setSortOrder] = useState('1');

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const filtered = sortedCategories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setSlug('');
    setIcon('☕');
    setSortOrder((sortedCategories.length + 1).toString());
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || '☕');
    setSortOrder(cat.sort_order.toString());
    setShowModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    const orderNum = parseInt(sortOrder) || 1;

    if (editingCat) {
      await updateCategory(editingCat.id, {
        name,
        slug: finalSlug,
        icon,
        sort_order: orderNum,
      });
    } else {
      await addCategory({
        name,
        slug: finalSlug,
        icon,
        sort_order: orderNum,
      });
    }

    setShowModal(false);
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;

    const updated = [...sortedCategories];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const payload = updated.map((c, i) => ({ id: c.id, sort_order: i + 1 }));
    await updateCategorySortOrders(payload);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${catName}"?`)) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Manajemen Kategori Menu & Urutan Struk</h1>
          <p className="text-xs text-stone-500">Kelola kategori produk dan atur urutan tampilan daftar produk pada cetakan struk kasir (misal: Minuman → Snack → Makanan Utama)</p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ListOrdered className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Konfigurasi Urutan Struk Pencetakan Kasir:</span>
          <span>Daftar item produk pada struk (modal & printer Bluetooth) akan dicetak berurutan berdasarkan nomor urutan (Sort Order) kategori ini. Gunakan tombol panah <ArrowUp className="w-3 h-3 inline" /> <ArrowDown className="w-3 h-3 inline" /> untuk mengubah posisi kategori secara instan.</span>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
          <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
            <tr>
              <th className="p-3 w-28">Urutan Struk</th>
              <th className="p-3">Nama Kategori</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Ikon</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {filtered.map((c, idx) => (
              <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                <td className="p-3 font-extrabold text-stone-700 dark:text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-coffee-700 dark:text-coffee-300">#{c.sort_order}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded disabled:opacity-30"
                        title="Naikkan Urutan Struk"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                      </button>
                      <button
                        disabled={idx === sortedCategories.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded disabled:opacity-30"
                        title="Turunkan Urutan Struk"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{c.name}</td>
                <td className="p-3 font-mono text-stone-500 dark:text-stone-400">{c.slug}</td>
                <td className="p-3 text-coffee-600 dark:text-coffee-400 font-semibold text-base">{c.icon}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-stone-400 dark:text-stone-400 hover:text-coffee-600 dark:hover:text-coffee-300 hover:bg-coffee-50 dark:hover:bg-coffee-950/40 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                <h2 className="text-lg font-bold">{editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-coffee-600 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: Minuman (Drink), Snack, Makanan"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Slug URL</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                  placeholder="minuman-drink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Ikon Emoji</label>
                  <input
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-center text-lg focus:outline-none"
                    placeholder="☕"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Urutan Struk (Sort Order)</label>
                  <input
                    type="number"
                    required
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold text-center focus:outline-none"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow"
                >
                  {editingCat ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
