import React, { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ShoppingCart, AlertTriangle, CheckCircle2, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const IngredientsView: React.FC = () => {
  const { ingredients, suppliers, addIngredient, fetchInitialData } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'gram' | 'ml' | 'pcs' | 'pack' | 'slice'>('gram');
  const [avgCost, setAvgCost] = useState('150');
  const [minStock, setMinStock] = useState('1000');

  // Excel import status messaging states
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Generate and download Excel import template
  const downloadExcelTemplate = () => {
    const headers = [
      {
        'Nama Bahan': 'Biji Kopi Arabika',
        'Satuan (gram/ml/pcs/pack/slice)': 'gram',
        'Biaya Rata-rata (Rp)': 120,
        'Minimum Stok': 1000,
      },
      {
        'Nama Bahan': 'Susu Segar UHT',
        'Satuan (gram/ml/pcs/pack/slice)': 'ml',
        'Biaya Rata-rata (Rp)': 25,
        'Minimum Stok': 2000,
      },
      {
        'Nama Bahan': 'Sedotan Plastik',
        'Satuan (gram/ml/pcs/pack/slice)': 'pcs',
        'Biaya Rata-rata (Rp)': 150,
        'Minimum Stok': 100,
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
          const rawUnit = String(row['Satuan (gram/ml/pcs/pack/slice)'] || '').trim().toLowerCase();
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

          // Check if it already exists to prevent duplicate raw material creations
          const alreadyExists = ingredients.some(
            (i) => i.name.toLowerCase() === String(rawName).trim().toLowerCase()
          );

          if (!alreadyExists) {
            await addIngredient({
              name: String(rawName).trim(),
              unit: finalUnit as any,
              avg_cost: isNaN(rawCost) ? 0 : rawCost,
              min_stock: isNaN(rawMin) ? 0 : rawMin,
              category_id: undefined,
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
            onClick={() => setShowModal(true)}
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
