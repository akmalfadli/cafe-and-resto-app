import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, Search, Calculator, X, Edit2, Upload } from 'lucide-react';
import type { Product } from '../../types';
import { storageService } from '../../services/storageService';

export const RecipeBuilderModal: React.FC<{ productId: string; onClose: () => void }> = ({ productId, onClose }) => {
  const { products, ingredients, recipes, saveRecipe } = useAppStore();
  const product = products.find((p) => p.id === productId);
  const currentRecipe = recipes.find((r) => r.product_id === productId);

  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; qty: number }[]>(
    currentRecipe ? currentRecipe.items.map((i) => ({ ingredientId: i.ingredient_id, qty: i.quantity })) : []
  );
  const [notes] = useState(currentRecipe?.notes || '');

  if (!product) return null;

  const calculatedMaterialCost = recipeItems.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    return sum + (ing?.avg_cost || 0) * item.qty;
  }, 0);

  const packagingCost = product.packaging_cost || 0;
  const serviceCost = product.service_cost || 0;
  const totalCost = calculatedMaterialCost + packagingCost + serviceCost;
  const sellingPrice = product.selling_price || 0;
  const profit = sellingPrice - totalCost;
  const marginPct = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';
  const markupPct = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : '0';

  const handleAddItem = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([...recipeItems, { ingredientId: ingredients[0].id, qty: 10 }]);
  };

  const handleRemoveItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    saveRecipe(productId, recipeItems, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200">
        
        <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Kalkulator Resep & HPP (Harga Pokok Penjualan)</h2>
            <p className="text-xs text-coffee-200">{product.name} ({product.sku})</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-coffee-600 rounded-full">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Bahan Baku Resep
              </label>
              <button
                onClick={handleAddItem}
                className="text-xs bg-coffee-50 text-coffee-600 font-bold px-3 py-1 rounded-lg border border-coffee-200 hover:bg-coffee-100 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahan Baku
              </button>
            </div>

            {recipeItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                Belum ada bahan baku yang dihubungkan ke produk ini.
              </div>
            ) : (
              <div className="space-y-2">
                {recipeItems.map((item, idx) => {
                  const ing = ingredients.find((i) => i.id === item.ingredientId);
                  const lineTotal = (ing?.avg_cost || 0) * item.qty;
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                      {/* Searchable Custom Dropdown Replacement for Select Option */}
                      <div className="flex-1 relative">
                        {(() => {
                          const [isOpen, setIsOpen] = useState(false);
                          const [dropSearch, setDropSearch] = useState('');
                          
                          const filteredIngredients = ingredients.filter(i => 
                            i.name.toLowerCase().includes(dropSearch.toLowerCase())
                          );

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 font-medium text-left text-xs flex justify-between items-center text-stone-800 dark:text-stone-100"
                              >
                                <span>
                                  {ing 
                                    ? `${ing.name} (Rp ${ing.avg_cost.toLocaleString('id-ID')} / ${ing.unit})`
                                    : '-- Pilih Bahan Baku --'}
                                </span>
                                <span className="text-[10px] text-stone-400">▼</span>
                              </button>

                              {isOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={() => {
                                      setIsOpen(false);
                                      setDropSearch('');
                                    }} 
                                  />
                                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-850 rounded-xl shadow-xl z-40 max-h-56 overflow-y-auto p-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="relative sticky top-0 bg-white dark:bg-stone-900 pb-1.5 z-10 border-b border-stone-100 dark:border-stone-850">
                                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                                      <input
                                        type="text"
                                        placeholder="Cari bahan baku..."
                                        value={dropSearch}
                                        onChange={(e) => setDropSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-coffee-500"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                      {filteredIngredients.length === 0 ? (
                                        <p className="text-[10px] text-stone-400 text-center py-2">Bahan tidak ditemukan</p>
                                      ) : (
                                        filteredIngredients.map((i) => (
                                          <button
                                            key={i.id}
                                            type="button"
                                            onClick={() => {
                                              const updated = [...recipeItems];
                                              updated[idx].ingredientId = i.id;
                                              setRecipeItems(updated);
                                              setIsOpen(false);
                                              setDropSearch('');
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition flex justify-between items-center ${
                                              item.ingredientId === i.id 
                                                ? 'bg-coffee-500 text-white font-bold' 
                                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850'
                                            }`}
                                          >
                                            <span className="truncate">{i.name}</span>
                                            <span className={`text-[9px] font-mono shrink-0 ml-2 ${item.ingredientId === i.id ? 'text-coffee-100' : 'text-stone-400'}`}>
                                              Rp {i.avg_cost} / {i.unit}
                                            </span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...recipeItems];
                            updated[idx].qty = parseFloat(e.target.value) || 0;
                            setRecipeItems(updated);
                          }}
                          className="w-20 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 rounded-lg px-2 py-1.5 font-bold text-center"
                        />
                        <span className="text-stone-500 dark:text-stone-400 font-semibold w-10">{ing?.unit}</span>
                      </div>

                      <span className="w-28 text-right font-bold text-stone-700 dark:text-stone-300">
                        Rp {lineTotal.toLocaleString('id-ID')}
                      </span>

                      <button onClick={() => handleRemoveItem(idx)} className="text-stone-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-coffee-500" />
              Rincian Biaya HPP Otomatis
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between"><span>Biaya Bahan Baku:</span><span className="font-bold">Rp {calculatedMaterialCost.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Biaya Kemasan:</span><span className="font-bold">Rp {packagingCost.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Biaya Layanan:</span><span className="font-bold">Rp {serviceCost.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between pt-1 border-t border-stone-300 font-extrabold text-stone-900">
                  <span>TOTAL HPP:</span>
                  <span>Rp {totalCost.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-1 border-l border-stone-200 pl-4">
                <div className="flex justify-between"><span>Harga Jual:</span><span className="font-bold text-coffee-600">Rp {sellingPrice.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Laba Kotor:</span><span className={`font-bold ${profit > 0 ? 'text-accent' : 'text-red-500'}`}>Rp {profit.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Persentase Margin:</span><span className="font-bold">{marginPct}%</span></div>
                <div className="flex justify-between"><span>Persentase Markup:</span><span className="font-bold">{markupPct}%</span></div>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-stone-100 p-4 flex justify-end gap-3 border-t border-stone-200">
          <button onClick={onClose} className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold hover:bg-white">
            Batal
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl text-xs font-bold shadow">
            Simpan Resep & Hitung HPP
          </button>
        </div>

      </div>
    </div>
  );
};

// Modal Edit / Tambah Produk
export const ProductFormModal: React.FC<{
  product?: Product | null;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const { categories, addProduct, updateProduct } = useAppStore();

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || `DRK-${Date.now().toString().slice(-4)}`);
  const [categoryId, setCategoryId] = useState(product?.category_id || categories[0]?.id || '');
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price?.toString() || '30000');
  const [packagingCost, setPackagingCost] = useState(product?.packaging_cost?.toString() || '1000');
  const [serviceCost, setServiceCost] = useState(product?.service_cost?.toString() || '500');
  const [imageUrl, setImageUrl] = useState(product?.image_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80');
  const [isFavorite, setIsFavorite] = useState(product?.is_favorite || false);
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      category_id: categoryId,
      name,
      sku,
      image_url: imageUrl,
      selling_price: parseFloat(sellingPrice) || 0,
      cost_price: product?.cost_price || 0,
      packaging_cost: parseFloat(packagingCost) || 0,
      service_cost: parseFloat(serviceCost) || 0,
      is_available: isAvailable,
      is_favorite: isFavorite,
    };

    if (product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
        <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {product ? 'Edit Produk & Menu' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-coffee-600 rounded-full">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div>
            <label className="font-semibold text-stone-600 block mb-1">Nama Produk</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="Contoh: Caffè Americano"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 font-medium focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Kemasan (Rp)</label>
              <input
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Layanan (Rp)</label>
              <input
                type="number"
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-600 block mb-1">Gambar Produk</label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-sm" />
              )}
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      const uploadedUrl = await storageService.uploadProductImage(file);
                      setImageUrl(uploadedUrl);
                    } catch (err: any) {
                      console.error('Upload Error:', err);
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="block w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-coffee-50 file:text-coffee-700 hover:file:bg-coffee-100 cursor-pointer"
                />
                {isUploading && (
                  <p className="text-[10px] text-coffee-600 font-bold flex items-center gap-1 animate-pulse">
                    <Upload className="w-3 h-3 animate-spin" /> Mengompresi & Mengunggah Gambar...
                  </p>
                )}
              </div>
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-none mt-2 text-[11px] font-mono text-stone-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-coffee-600 focus:ring-coffee-500"
              />
              <span>Tandai Favorit</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-coffee-600 focus:ring-coffee-500"
              />
              <span>Stok Tersedia</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow"
            >
              {product ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductsView: React.FC = () => {
  const { products, categories, deleteProduct } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeRecipeProdId, setActiveRecipeProdId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Manajemen Produk & Menu</h1>
          <p className="text-xs text-stone-500">Atur harga jual, kalkulator HPP resep, dan stok menu</p>
        </div>

        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari produk berdasarkan nama atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
            <tr>
              <th className="p-3">Produk</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Harga Jual</th>
              <th className="p-3">Harga HPP</th>
              <th className="p-3">Margin</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              const totalCost = p.cost_price + p.packaging_cost + p.service_cost;
              const profit = p.selling_price - totalCost;
              const margin = p.selling_price > 0 ? Math.round((profit / p.selling_price) * 100) : 0;

              return (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-stone-800">{p.name}</h4>
                        <span className="text-[10px] font-mono text-stone-400">{p.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-stone-600">{cat?.name}</td>
                  <td className="p-3 font-bold text-coffee-600">Rp {p.selling_price.toLocaleString('id-ID')}</td>
                  <td className="p-3 font-medium text-stone-600">Rp {totalCost.toLocaleString('id-ID')}</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {margin}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg font-semibold flex items-center gap-1"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Edit</span>
                      </button>
                      <button
                        onClick={() => setActiveRecipeProdId(p.id)}
                        className="p-1.5 bg-coffee-50 text-coffee-600 hover:bg-coffee-100 rounded-lg font-semibold flex items-center gap-1"
                        title="Atur Resep & HPP"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Resep</span>
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {activeRecipeProdId && (
        <RecipeBuilderModal productId={activeRecipeProdId} onClose={() => setActiveRecipeProdId(null)} />
      )}
    </div>
  );
};
