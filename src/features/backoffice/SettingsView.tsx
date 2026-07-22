import React, { useState } from 'react';
import { Printer, Percent, Store, CheckCircle, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { storageService } from '../../services/storageService';
import { printerService } from '../../services/printerService';

export const SettingsView: React.FC = () => {
  const { taxRate, serviceRate, receiptHeader, receiptFooter, receiptLogo, outletName, outletPhone, enableTableNumber, enableTax, saveSystemSettings } = useAppStore();
  const [outletNameInput, setOutletNameInput] = useState(outletName);
  const [phoneInput, setPhoneInput] = useState(outletPhone);
  const [taxInput, setTaxInput] = useState(taxRate.toString());
  const [serviceInput, setServiceInput] = useState(serviceRate.toString());
  const [headerInput, setHeaderInput] = useState(receiptHeader);
  const [footerInput, setFooterInput] = useState(receiptFooter);
  const [logoInput, setLogoInput] = useState(receiptLogo);
  const [enableTablesInput, setEnableTablesInput] = useState(enableTableNumber);
  const [enableTaxInput, setEnableTaxInput] = useState(enableTax);
  const [isUploading, setIsUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSystemSettings({
      outletName: outletNameInput,
      outletPhone: phoneInput,
      taxRate: parseFloat(taxInput) || 0,
      serviceRate: parseFloat(serviceInput) || 0,
      receiptHeader: headerInput,
      receiptFooter: footerInput,
      receiptLogo: logoInput,
      enableTableNumber: enableTablesInput,
      enableTax: enableTaxInput,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-stone-800">Pengaturan Sistem & Outlet</h1>
        <p className="text-xs text-stone-500">Konfigurasi nama toko, kustomisasi header/footer struk, dan printer termal</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Pengaturan & Kustomisasi Struk Berhasil Disimpan!
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 border-b pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-coffee-500" /> Profil Toko / Outlet
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Nama Outlet</label>
              <input
                type="text"
                value={outletNameInput}
                onChange={(e) => setOutletNameInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition">
              <input
                type="checkbox"
                checked={enableTablesInput}
                onChange={(e) => setEnableTablesInput(e.target.checked)}
                className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs text-stone-800 block">Aktifkan Nomor Meja Resto</span>
                <span className="text-[10px] text-stone-500">Nyahaktifkan jika kafe/resto Anda outdoor, taman, atau tanpa nomor meja khusus.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Kustomisasi Header & Footer Struk Printer */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 border-b pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-coffee-500" /> Kustomisasi Logo, Header & Footer Struk
          </h3>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-stone-600 block">Logo Struk Resto</label>
            <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              {logoInput ? (
                <img src={logoInput} alt="Logo Struk" className="w-16 h-16 object-contain rounded-lg border border-stone-300 bg-white p-1" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-stone-200 border border-dashed border-stone-400 flex items-center justify-center text-stone-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
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
                      setLogoInput(uploadedUrl);
                    } catch (err: any) {
                      console.error('Upload Logo Error:', err);
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="block w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-coffee-50 file:text-coffee-700 hover:file:bg-coffee-100 cursor-pointer"
                />
                {isUploading && (
                  <p className="text-[10px] text-coffee-600 font-bold flex items-center gap-1 animate-pulse">
                    <Upload className="w-3 h-3 animate-spin" /> Mengompresi & Mengunggah Logo...
                  </p>
                )}
                {logoInput && (
                  <button
                    type="button"
                    onClick={() => setLogoInput('')}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Hapus Logo Struk
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Header Struk (Atas)</label>
              <textarea
                rows={3}
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl font-mono text-stone-700 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="Nama Resto & Alamat Lengkap..."
              />
              <p className="text-[10px] text-stone-400 mt-1">Muncul paling atas pada struk cetak & thermal bluetooth.</p>
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Footer Struk (Bawah)</label>
              <textarea
                rows={3}
                value={footerInput}
                onChange={(e) => setFooterInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl font-mono text-stone-700 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="Pesan Penutup & Media Sosial..."
              />
              <p className="text-[10px] text-stone-400 mt-1">Muncul paling bawah pada struk cetak & thermal bluetooth.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 border-b pb-2 flex items-center gap-2">
            <Percent className="w-4 h-4 text-coffee-500" /> Tarif Pajak & Biaya Bawaan
          </h3>

          <div>
            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition mb-3">
              <input
                type="checkbox"
                checked={enableTaxInput}
                onChange={(e) => setEnableTaxInput(e.target.checked)}
                className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs text-stone-800 block">Aktifkan Pajak Resto (PB1)</span>
                <span className="text-[10px] text-stone-500">Hitung & tampilkan pajak pada transaksi kasir serta struk pencetakan.</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Tarif Pajak (%)</label>
              <input
                type="number"
                value={taxInput}
                onChange={(e) => setTaxInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Biaya Layanan (%)</label>
              <input
                type="number"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                className="w-full border px-3 py-2 rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 border-b pb-2 flex items-center gap-2">
            <Printer className="w-4 h-4 text-coffee-500" /> Pengaturan Printer Termal & Bluetooth ESC/POS
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-stone-600 block mb-1">Printer Struk Aktif</label>
              <select className="w-full border px-3 py-2 rounded-xl font-medium focus:outline-none">
                <option>Bluetooth Thermal Printer 58mm / 80mm (ESC/POS Auto-Connect)</option>
                <option>Epson TM-T82 Thermal Printer (USB/LAN)</option>
                <option>Star Micronics TSP100</option>
              </select>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-800">Printer Bluetooth Tersimpan</p>
                <p className="text-[10px] text-stone-500">Kasir otomatis terhubung ke printer tanpa perlu memilih ulang setiap kali cetak.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  printerService.forgetSavedPrinter();
                  alert('Printer tersimpan berhasil direset. Kasir akan diminta memilih printer pada pencetakan berikutnya.');
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold border border-red-200 transition"
              >
                Reset Bluetooth Printer
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-coffee-500 hover:bg-coffee-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition"
        >
          Simpan Konfigurasi Sistem
        </button>

      </form>
    </div>
  );
};
