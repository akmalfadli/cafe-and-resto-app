import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, UtensilsCrossed, Users, X } from 'lucide-react';

export const TablesView: React.FC = () => {
  const { tables, addTable, deleteTable } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;

    await addTable({
      table_number: tableNumber,
      capacity: parseInt(capacity) || 4,
    });

    setTableNumber('');
    setCapacity('4');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Manajemen Meja Resto</h1>
          <p className="text-xs text-stone-500">Kelola daftar nomor meja, kapasitas kursi, dan ketersediaan</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Meja Baru
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 relative group"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-coffee-50 text-coffee-600 rounded-xl">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <button
                onClick={() => deleteTable(t.id)}
                className="text-stone-300 hover:text-red-500 p-1 transition opacity-0 group-hover:opacity-100"
                title="Hapus Meja"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-stone-800">Meja {t.table_number}</h3>
              <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                <Users className="w-3.5 h-3.5" />
                <span>{t.capacity} Kursi</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                Tersedia
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">Tambah Meja Resto</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-coffee-600 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nomor / Kode Meja</label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: T-05 atau M-01"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Kapasitas Kursi</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold focus:outline-none"
                  placeholder="4"
                />
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
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
