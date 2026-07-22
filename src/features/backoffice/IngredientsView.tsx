import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShoppingCart, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const IngredientsView: React.FC = () => {
  const { ingredients, suppliers, addIngredient } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'gram' | 'ml' | 'pcs' | 'pack' | 'slice'>('gram');
  const [avgCost, setAvgCost] = useState('150');
  const [minStock, setMinStock] = useState('1000');

  const handleCreate = async () => {
    if (!name) return;
    await addIngredient({
      name,
      unit,
      avg_cost: parseFloat(avgCost) || 0,
      min_stock: parseFloat(minStock) || 0,
      category_id: undefined,
      supplier_id: suppliers[0]?.id,
    });
    setName('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Bahan Baku & Inventaris</h1>
          <p className="text-xs text-stone-500">Pantau stok bahan mentah, peringatan stok minim, dan pembelian barang</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Tambah Bahan Baku
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ingredients.map((ing) => {
          const isLowStock = ing.current_stock <= ing.min_stock;
          return (
            <div key={ing.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-stone-800">{ing.name}</h3>
                  <span className="text-[10px] text-stone-400 font-mono">Rp {ing.avg_cost.toLocaleString('id-ID')} / {ing.unit}</span>
                </div>
                {isLowStock ? (
                  <span className="p-1 bg-red-100 text-red-600 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Stok Rendah
                  </span>
                ) : (
                  <span className="p-1 bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aman
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-between items-baseline">
                <span className="text-xs text-stone-500">Stok Saat Ini:</span>
                <span className={`text-base font-extrabold ${isLowStock ? 'text-red-600' : 'text-stone-800'}`}>
                  {ing.current_stock.toLocaleString()} {ing.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-stone-200">
            <h3 className="font-bold text-base text-stone-800">Tambah Bahan Baku Baru</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-600">Nama Bahan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 mt-1 font-bold"
                  placeholder="Contoh: Kopi Arabika"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600">Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 mt-1"
                >
                  <option value="gram">gram</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="slice">slice</option>
                  <option value="pack">pack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600">Biaya Rata-rata (Rp)</label>
                  <input
                    type="number"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-600">Minimum Stok</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 mt-1 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl font-semibold text-xs">
                Batal
              </button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-coffee-500 text-white rounded-xl font-bold text-xs shadow">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
