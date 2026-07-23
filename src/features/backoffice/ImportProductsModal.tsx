import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const downloadTemplateExcel = () => {
  const templateData = [
    {
      SKU: 'DRK-001',
      Nama_Produk: 'Kopi Susu Gula Aren',
      Kategori: 'Minuman',
      Harga_Jual: 18000,
      Biaya_Kemasan: 1000,
      Biaya_Layanan: 500,
      URL_Gambar: '',
      Favorit: 'YA'
    },
    {
      SKU: 'SNK-002',
      Nama_Produk: 'Croissant Cokelat',
      Kategori: 'Snack',
      Harga_Jual: 22000,
      Biaya_Kemasan: 500,
      Biaya_Layanan: 0,
      URL_Gambar: '',
      Favorit: 'TIDAK'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Import_Produk');
  XLSX.writeFile(workbook, 'Template_Import_Produk_CafePOS.xlsx');
};

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, addProduct } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  // Read Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data);
      } catch (err: any) {
        alert('Gagal membaca file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Import Products Action
  const handleProcessImport = async () => {
    if (previewData.length === 0) return;
    setIsProcessing(true);
    let successCount = 0;
    let failedCount = 0;
    const errorsList: string[] = [];

    // Local categories cache
    let currentCategories = [...categories];

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      const rowNum = i + 2; // Excel row index offset (row 1 is header)

      try {
        const name = (row['Nama_Produk'] || row['nama_produk'] || row['Nama'] || '').toString().trim();
        const sku = (row['SKU'] || row['sku'] || `PRD-${Date.now().toString().slice(-4)}-${i}`).toString().trim();
        const catName = (row['Kategori'] || row['kategori'] || 'Umum').toString().trim();
        const sellingPrice = parseFloat(row['Harga_Jual'] || row['harga_jual'] || row['Harga'] || '0') || 0;
        const packagingCost = parseFloat(row['Biaya_Kemasan'] || row['biaya_kemasan'] || '0') || 0;
        const serviceCost = parseFloat(row['Biaya_Layanan'] || row['biaya_layanan'] || '0') || 0;
        const imageUrl = (row['URL_Gambar'] || row['url_gambar'] || '').toString().trim() || 
          'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80';
        const favInput = (row['Favorit'] || row['favorit'] || '').toString().toUpperCase().trim();
        const isFavorite = favInput === 'YA' || favInput === 'YES' || favInput === 'TRUE' || favInput === '1';

        if (!name) {
          failedCount++;
          errorsList.push(`Baris ${rowNum}: Nama produk wajib diisi.`);
          continue;
        }

        // Find or create Category dynamically
        let targetCatId = '';
        const matchedCat = currentCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        
        if (matchedCat) {
          targetCatId = matchedCat.id;
        } else {
          const newSlug = catName.toLowerCase().replace(/\s+/g, '-');
          const createdCat = await addCategory({
            name: catName,
            slug: newSlug,
            icon: '☕',
            sort_order: currentCategories.length + 1
          });
          targetCatId = createdCat.id;
          currentCategories.push(createdCat);
        }

        // Create product entity
        await addProduct({
          category_id: targetCatId,
          name,
          sku,
          selling_price: sellingPrice,
          cost_price: 0,
          packaging_cost: packagingCost,
          service_cost: serviceCost,
          image_url: imageUrl,
          is_favorite: isFavorite,
          is_available: true
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errorsList.push(`Baris ${rowNum}: ${err.message || 'Gagal mengimpor produk'}`);
      }
    }

    setIsProcessing(false);
    setImportResult({
      success: successCount,
      failed: failedCount,
      errors: errorsList
    });
    setPreviewData([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-coffee-500 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Import Produk & Menu dari Excel</h2>
              <p className="text-xs text-coffee-100">Tambah banyak produk sekaligus menggunakan file .xlsx / .xls</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-coffee-600 rounded-full transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Step 1: Download Template */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-stone-800 dark:text-stone-100 block">Langkah 1: Unduh Format Format Excel</span>
              <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                Gunakan template standar agar nama kolom dan format data produk sesuai.
              </p>
            </div>
            <button
              onClick={downloadTemplateExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              Unduh Template (.xlsx)
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <label className="font-extrabold text-stone-800 dark:text-stone-100 block">
              Langkah 2: Pilih & Unggah File Excel (.xlsx / .xls)
            </label>
            <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 text-center hover:bg-stone-50 dark:hover:bg-stone-800/40 transition relative cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-coffee-500 mx-auto mb-2" />
              <p className="font-bold text-stone-700 dark:text-stone-200">Klik di sini atau seret file Excel ke area ini</p>
              <p className="text-[10px] text-stone-400 mt-1">Mendukung format Microsoft Excel .xlsx atau .xls</p>
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-4 rounded-xl border space-y-2 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-stone-800 dark:text-stone-100">Proses Import Selesai</span>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {importResult.success} Berhasil diimpor</span>
                {importResult.failed > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-bold">✕ {importResult.failed} Gagal</span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/40 rounded-lg text-red-700 dark:text-red-300 text-[11px] space-y-1 max-h-32 overflow-y-auto font-mono">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-stone-800 dark:text-stone-100">
                  Pratinjau Data ({previewData.length} Produk Ditemukan)
                </span>
                <span className="text-[10px] text-stone-400">Pastikan data produk sudah sesuai</span>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Nama Produk</th>
                      <th className="p-2">Kategori</th>
                      <th className="p-2">Harga Jual</th>
                      <th className="p-2">Kemasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-850">
                        <td className="p-2 font-mono">{row['SKU'] || row['sku'] || '-'}</td>
                        <td className="p-2 font-bold text-stone-800 dark:text-stone-100">{row['Nama_Produk'] || row['nama_produk'] || '-'}</td>
                        <td className="p-2">{row['Kategori'] || row['kategori'] || 'Umum'}</td>
                        <td className="p-2 font-semibold text-coffee-600">Rp {parseFloat(row['Harga_Jual'] || row['harga_jual'] || '0').toLocaleString('id-ID')}</td>
                        <td className="p-2">Rp {parseFloat(row['Biaya_Kemasan'] || row['biaya_kemasan'] || '0').toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 dark:bg-stone-800 p-4 flex justify-end gap-3 border-t border-stone-200 dark:border-stone-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-xl font-bold text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition"
          >
            Tutup
          </button>
          {previewData.length > 0 && (
            <button
              disabled={isProcessing}
              onClick={handleProcessImport}
              className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl font-extrabold shadow transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? 'Memproses...' : `Impor ${previewData.length} Produk Now`}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
