import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShoppingCart, AlertTriangle, CheckCircle2, Download, Upload, FileSpreadsheet, Search, Grid, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

export const IngredientsView: React.FC = () => {
  const { ingredients, suppliers, addIngredient, updateIngredient, fetchInitialData } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'gram' | 'ml' | 'pcs' | 'pack' | 'slice'>('gram');
  const [avgCost, setAvgCost] = useState('150');
  const [minStock, setMinStock] = useState('1000');
  const [supplierId, setSupplierId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDbCategories = async () => {
      try {
        const { data, error } = await supabase.from('ingredient_categories').select('id, name');
        if (!error && data) {
          setDbCategories(data);
        }
      } catch (e) {
        console.warn('Failed to load ingredient_categories:', e);
      }
    };
    loadDbCategories();
  }, [ingredients]);

  // Excel import status messaging states
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stock Adjustment modal states
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedAdjustIng, setSelectedAdjustIng] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState('1000');

  // Filter category state
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // Layout view mode state (card vs list)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const handleCreate = async () => {
    if (!name) return;
    const ingPayload = {
      name,
      unit,
      avg_cost: parseFloat(avgCost) || 0,
      min_stock: parseFloat(minStock) || 0,
      category_id: category ? category : undefined,
      supplier_id: supplierId ? supplierId : undefined,
    };

    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, ingPayload);
    } else {
      await addIngredient(ingPayload);
    }

    setName('');
    setSupplierId('');
    setCategory('');
    setEditingIngredient(null);
    setShowModal(false);
  };

  // Generate and download Excel import template
  const downloadExcelTemplate = () => {
    const headers = [
      {
        'Nama Bahan': 'Biji Kopi Arabika',
        'Kategori (Makanan/Minuman)': 'Minuman',
        'Satuan (gram/ml/pcs/pack/slice)': 'gram',
        'Stok Saat Ini': 5000,
        'Biaya Rata-rata (Rp)': 120,
        'Minimum Stok': 1000,
      },
      {
        'Nama Bahan': 'Susu Segar UHT',
        'Kategori (Makanan/Minuman)': 'Minuman',
        'Satuan (gram/ml/pcs/pack/slice)': 'ml',
        'Stok Saat Ini': 10000,
        'Biaya Rata-rata (Rp)': 25,
        'Minimum Stok': 2000,
      },
      {
        'Nama Bahan': 'Daging Slice',
        'Kategori (Makanan/Minuman)': 'Makanan',
        'Satuan (gram/ml/pcs/pack/slice)': 'slice',
        'Stok Saat Ini': 200,
        'Biaya Rata-rata (Rp)': 2500,
        'Minimum Stok': 50,
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Impor Bahan Baku');
    XLSX.writeFile(workbook, 'format_impor_bahan_baku.xlsx');
  };

  // Parse uploaded Excel spreadsheet
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsImporting(true);
    setImportStatus(null);
    const file = files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error('File tidak dapat dibaca.');
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse rows as raw JSON array
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        if (rawRows.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        let importCount = 0;
        let skippedCount = 0;

        for (const row of rawRows) {
          const rawName = row['Nama Bahan'];
          const rawCat = String(row['Kategori (Makanan/Minuman)'] || '').trim();
          const rawUnit = String(row['Satuan (gram/ml/pcs/pack/slice)'] || '').trim().toLowerCase();
          const rawStock = parseFloat(row['Stok Saat Ini'] || row['Stok'] || row['Stok Awal'] || '0');
          const rawCost = parseFloat(row['Biaya Rata-rata (Rp)']);
          const rawMin = parseFloat(row['Minimum Stok']);

          // Basic fields validation
          if (!rawName) {
            skippedCount++;
            continue;
          }

          // Validate Unit constraints
          const validUnits = ['gram', 'ml', 'pcs', 'pack', 'slice'];
          const finalUnit = validUnits.includes(rawUnit) ? rawUnit : 'gram';

          // Validate Category constraints
          let finalCatName = '';
          if (rawCat.toLowerCase().includes('makan')) {
            finalCatName = 'Makanan';
          } else if (rawCat.toLowerCase().includes('minum')) {
            finalCatName = 'Minuman';
          }

          // Map string name to database UUID category record
          let finalCatId: string | undefined = undefined;
          if (finalCatName) {
            const foundCategory = dbCategories.find(
              (c) => c.name.toLowerCase() === finalCatName.toLowerCase()
            );
            if (foundCategory) {
              finalCatId = foundCategory.id;
            }
          }

          // Check if it already exists to prevent duplicate raw material creations
          const alreadyExists = ingredients.some(
            (i) => i.name.toLowerCase() === String(rawName).trim().toLowerCase()
          );

          if (!alreadyExists) {
            await addIngredient({
              name: String(rawName).trim(),
              unit: finalUnit as any,
              current_stock: isNaN(rawStock) ? 0 : rawStock,
              avg_cost: isNaN(rawCost) ? 0 : rawCost,
              min_stock: isNaN(rawMin) ? 0 : rawMin,
              category_id: finalCatId,
              supplier_id: suppliers[0]?.id,
            });
            importCount++;
          } else {
            skippedCount++;
          }
        }

        setImportStatus({
          type: 'success',
          message: `Berhasil mengimpor ${importCount} bahan baku baru. (${skippedCount} baris dilewati/sudah ada).`,
        });

        // Trigger store refresh to pull updated values
        await fetchInitialData();

      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err?.message || 'Gagal memproses file Excel. Pastikan format kolom sesuai.',
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Gagal membaca file.' });
      setIsImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  const filteredIngredients = ingredients.filter((ing) => {
    // Apply Search Query matching filter
    if (searchQuery) {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply Category filter
    if (selectedFilterCategory === 'all') return true;
    if (selectedFilterCategory === 'none') return !ing.category_id;

    // Resolve name from DB Categories if it is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ing.category_id || '');
    const categoryName = isUuid 
      ? dbCategories.find(c => c.id === ing.category_id)?.name || 'Bahan Baku'
      : ing.category_id || '';

    return categoryName.toLowerCase() === selectedFilterCategory.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Bahan Baku & Inventaris</h1>
          <p className="text-xs text-stone-500">Pantau stok bahan mentah, peringatan stok minim, dan pembelian barang</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download template */}
          <button
            onClick={downloadExcelTemplate}
            className="bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition"
            title="Unduh Format excel untuk impor"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Format Excel</span>
          </button>

          {/* Upload excel input */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Mengimpor...' : 'Impor Excel'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelImport}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <button
            onClick={() => {
              setEditingIngredient(null);
              setName('');
              setUnit('gram');
              setAvgCost('150');
              setMinStock('1000');
              setSupplierId('');
              setCategory('');
              setShowModal(true);
            }}
            className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Tambah Bahan Baku
          </button>
        </div>
      </div>

      {/* Import Status Alert Banner */}
      {importStatus && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          importStatus.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)} className="ml-auto hover:underline font-extrabold text-[10px]">
            Tutup
          </button>
        </div>
      )}

      {/* Search and Category Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama bahan baku..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
          />
        </div>

        {/* Category Filter and View Mode Switcher Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between md:justify-end shrink-0">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">Kategori:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'Makanan', label: 'Makanan' },
              { id: 'Minuman', label: 'Minuman' },
              { id: 'none', label: 'Tanpa Kategori' },
            ].map((tab) => {
              const isActive = selectedFilterCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilterCategory(tab.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    isActive 
                      ? 'bg-coffee-500 text-white shadow' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher (Single Icon Toggle Button) */}
          <button
            onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-250 rounded-xl transition text-stone-700 hover:text-stone-900 shrink-0 flex items-center justify-center"
            title={viewMode === 'card' ? 'Tampilkan sebagai List' : 'Tampilkan sebagai Card'}
          >
            {viewMode === 'card' ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredIngredients.map((ing) => {
            const isLowStock = ing.current_stock <= ing.min_stock;
            return (
              <div key={ing.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">
                      {ing.name}
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono">Rp {ing.avg_cost.toLocaleString('id-ID')} / {ing.unit}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isLowStock ? (
                      <span className="p-1 bg-red-100 text-red-600 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Stok Rendah
                      </span>
                    ) : (
                      <span className="p-1 bg-emerald-100 text-emerald-600 rounded-lg flex items-center gap-1 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aman
                      </span>
                    )}
                    {ing.category_id && (() => {
                      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ing.category_id);
                      const categoryName = isUuid 
                        ? dbCategories.find(c => c.id === ing.category_id)?.name || 'Bahan Baku'
                        : ing.category_id;

                      const isFood = categoryName.toLowerCase().includes('makan');
                      return (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase inline-block ${
                          isFood ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {categoryName}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Stok Saat Ini:</span>
                    <span className={`text-xs font-extrabold ${isLowStock ? 'text-red-600' : 'text-stone-800'}`}>
                      {ing.current_stock.toLocaleString()} {ing.unit}
                    </span>

                    {ing.supplier_id && (
                      <span className="text-[9px] text-stone-400 block mt-0.5">
                        Pemasok: {suppliers.find(s => s.id === ing.supplier_id)?.name || 'Pemasok Utama'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedAdjustIng(ing);
                        setAdjustQty('1000');
                        setAdjustModalOpen(true);
                      }}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-bold text-emerald-700 transition"
                    >
                      + Stok
                    </button>
                    <button
                      onClick={() => {
                        setEditingIngredient(ing);
                        setName(ing.name);
                        setUnit(ing.unit);
                        setAvgCost(String(ing.avg_cost));
                        setMinStock(String(ing.min_stock));
                        setSupplierId(ing.supplier_id || '');
                        setCategory(ing.category_id || '');
                        setShowModal(true);
                      }}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-coffee-500 hover:text-white rounded-lg text-[10px] font-bold text-stone-600 transition"
                    >
                      Ubah
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
              <tr>
                <th className="p-3">Nama Bahan</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Stok Saat Ini</th>
                <th className="p-3">Stok Minimum</th>
                <th className="p-3">Biaya Rata-rata</th>
                <th className="p-3">Pemasok</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredIngredients.map((ing) => {
                const isLowStock = ing.current_stock <= ing.min_stock;
                
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ing.category_id || '');
                const categoryName = ing.category_id 
                  ? (isUuid ? dbCategories.find(c => c.id === ing.category_id)?.name || 'Bahan Baku' : ing.category_id)
                  : '-';
                const isFood = categoryName.toLowerCase().includes('makan');

                return (
                  <tr key={ing.id} className="hover:bg-stone-50 transition">
                    <td className="p-3 font-bold text-stone-850">{ing.name}</td>
                    <td className="p-3 font-semibold text-stone-600">
                      {ing.category_id ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase inline-block ${
                          isFood ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {categoryName}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-stone-800'}`}>
                        {ing.current_stock.toLocaleString()} {ing.unit}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600 font-medium">{ing.min_stock.toLocaleString()} {ing.unit}</td>
                    <td className="p-3 text-stone-600 font-medium">Rp {ing.avg_cost.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-stone-500 font-medium">
                      {ing.supplier_id ? (suppliers.find(s => s.id === ing.supplier_id)?.name || 'Pemasok Utama') : '-'}
                    </td>
                    <td className="p-3">
                      {isLowStock ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-bold text-[9px] inline-flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Stok Rendah
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md font-bold text-[9px] inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Aman
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAdjustIng(ing);
                            setAdjustQty('1000');
                            setAdjustModalOpen(true);
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-bold text-emerald-700 transition"
                        >
                          + Stok
                        </button>
                        <button
                          onClick={() => {
                            setEditingIngredient(ing);
                            setName(ing.name);
                            setUnit(ing.unit);
                            setAvgCost(String(ing.avg_cost));
                            setMinStock(String(ing.min_stock));
                            setSupplierId(ing.supplier_id || '');
                            setCategory(ing.category_id || '');
                            setShowModal(true);
                          }}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-coffee-500 hover:text-white rounded-lg text-[10px] font-bold text-stone-600 transition"
                        >
                          Ubah
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
              {editingIngredient ? 'Ubah Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-400">Nama Bahan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: Kopi Arabika"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-400">Satuan Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1"
                >
                  <option value="gram">gram</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="slice">slice</option>
                  <option value="pack">pack</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-400">Kategori (Makanan/Minuman) - Opsional</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1 font-medium"
                >
                  <option value="">-- Tanpa Kategori (Kosong) --</option>
                  {dbCategories.length > 0 ? (
                    dbCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-400">Pemasok (Supplier) - Opsional</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1 font-medium"
                >
                  <option value="">-- Tanpa Pemasok (Kosong) --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-400">Biaya Rata-rata (Rp)</label>
                  <input
                    type="number"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-400">Minimum Stok</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 mt-1 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingIngredient(null);
                  setName('');
                  setUnit('gram');
                  setAvgCost('150');
                  setMinStock('1000');
                  setSupplierId('');
                  setCategory('');
                }} 
                className="flex-1 py-2 border rounded-xl font-semibold text-xs text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Batal
              </button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-coffee-500 text-white rounded-xl font-bold text-xs shadow">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {adjustModalOpen && selectedAdjustIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-200 dark:border-stone-800">
            <div>
              <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">Tambah Stok Bahan Baku</h3>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Menambah jumlah persediaan untuk: <strong className="text-stone-700 dark:text-stone-300">{selectedAdjustIng.name}</strong></p>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-400 block mb-1">Jumlah Tambahan ({selectedAdjustIng.unit})</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: 1000"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setAdjustModalOpen(false);
                  setSelectedAdjustIng(null);
                }} 
                className="flex-1 py-2 border rounded-xl font-semibold text-xs text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  const qtyToAdd = parseFloat(adjustQty) || 0;
                  if (qtyToAdd > 0) {
                    const currentStock = selectedAdjustIng.current_stock || 0;
                    await updateIngredient(selectedAdjustIng.id, {
                      current_stock: currentStock + qtyToAdd
                    });
                  }
                  setAdjustModalOpen(false);
                  setSelectedAdjustIng(null);
                }} 
                className="flex-1 py-2 bg-coffee-500 text-white rounded-xl font-bold text-xs shadow"
              >
                Simpan Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
