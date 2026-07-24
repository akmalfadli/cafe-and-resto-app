import React, { useState } from 'react';
import { Printer, Percent, Store, CheckCircle, FileText, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { storageService } from '../../services/storageService';
import { printerService } from '../../services/printerService';

export const SettingsView: React.FC = () => {
  const { taxRate, serviceRate, receiptHeader, receiptFooter, receiptLogo, outletName, outletPhone, enableTableNumber, enableTax, outletLat, outletLng, maxAttendanceRadius, enableGpsValidation, saveSystemSettings } = useAppStore();
  const [outletNameInput, setOutletNameInput] = useState(outletName);
  const [phoneInput, setPhoneInput] = useState(outletPhone);
  const [taxInput, setTaxInput] = useState(taxRate.toString());
  const [serviceInput, setServiceInput] = useState(serviceRate.toString());
  const [headerInput, setHeaderInput] = useState(receiptHeader);
  const [footerInput, setFooterInput] = useState(receiptFooter);
  const [logoInput, setLogoInput] = useState(receiptLogo);
  const [enableTablesInput, setEnableTablesInput] = useState(enableTableNumber);
  const [enableTaxInput, setEnableTaxInput] = useState(enableTax);
  
  // GPS & Geofencing States
  const [latInput, setLatInput] = useState(outletLat?.toString() || '-6.200000');
  const [lngInput, setLngInput] = useState(outletLng?.toString() || '106.816666');
  const [radiusInput, setRadiusInput] = useState(maxAttendanceRadius?.toString() || '100');
  const [enableGpsInput, setEnableGpsInput] = useState(enableGpsValidation ?? true);

  const [isUploading, setIsUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLngInput(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
      },
      (err) => {
        alert('Gagal mengambil koordinat GPS: ' + err.message);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

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
      outletLat: parseFloat(latInput) || 0,
      outletLng: parseFloat(lngInput) || 0,
      maxAttendanceRadius: parseFloat(radiusInput) || 100,
      enableGpsValidation: enableGpsInput,
    });
    setSavedSuccess(true);
    setShowSuccessModal(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">Pengaturan Sistem & Outlet</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">Konfigurasi nama toko, kustomisasi header/footer struk, dan printer termal</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        
        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Pengaturan & Kustomisasi Struk Berhasil Disimpan!
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-coffee-500" /> Profil Toko / Outlet
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Nama Outlet</label>
              <input
                type="text"
                value={outletNameInput}
                onChange={(e) => setOutletNameInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-100/70 dark:hover:bg-stone-800 transition">
              <input
                type="checkbox"
                checked={enableTablesInput}
                onChange={(e) => setEnableTablesInput(e.target.checked)}
                className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs text-stone-800 dark:text-stone-100 block">Aktifkan Nomor Meja Resto</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Nyahaktifkan jika kafe/resto Anda outdoor, taman, atau tanpa nomor meja khusus.</span>
              </div>
            </label>

            {/* GPS Geofencing Settings */}
            <div className="bg-stone-50/80 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-100 block">Validasi Lokasi GPS & Geofencing Absensi</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">Karyawan hanya bisa absen jika berada di lokasi outlet.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGpsInput}
                    onChange={(e) => setEnableGpsInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-coffee-500"></div>
                </label>
              </div>

              {enableGpsInput && (
                <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Latitude Outlet</label>
                      <input
                        type="text"
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        placeholder="-6.200000"
                        className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Longitude Outlet</label>
                      <input
                        type="text"
                        value={lngInput}
                        onChange={(e) => setLngInput(e.target.value)}
                        placeholder="106.816666"
                        className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Radius Absen (Meter)</label>
                      <input
                        type="number"
                        value={radiusInput}
                        onChange={(e) => setRadiusInput(e.target.value)}
                        placeholder="100"
                        className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">
                      Batas maksimal jarak lokasi perangkat karyawan saat absen (contoh: 50m / 100m).
                    </p>
                    <button
                      type="button"
                      onClick={detectCurrentLocation}
                      disabled={detectingGps}
                      className="px-3 py-1.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-lg font-bold text-[11px] shadow transition shrink-0 disabled:opacity-50"
                    >
                      {detectingGps ? 'Mengambil GPS...' : '📍 Gunakan Lokasi Perangkat Ini'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kustomisasi Header & Footer Struk Printer */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-coffee-500" /> Kustomisasi Logo, Header & Footer Struk
          </h3>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-stone-600 dark:text-stone-300 block">Logo Struk Resto</label>
            <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
              {logoInput ? (
                <img src={logoInput} alt="Logo Struk" className="w-16 h-16 object-contain rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-1" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-stone-200 dark:bg-stone-800 border border-dashed border-stone-400 dark:border-stone-700 flex items-center justify-center text-stone-400">
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
                  className="block w-full text-xs text-stone-500 dark:text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-coffee-50 dark:file:bg-coffee-950/40 file:text-coffee-700 dark:file:text-coffee-300 hover:file:bg-coffee-100 cursor-pointer"
                />
                {isUploading && (
                  <p className="text-[10px] text-coffee-600 dark:text-coffee-400 font-bold flex items-center gap-1 animate-pulse">
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
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Header Struk (Atas)</label>
              <textarea
                rows={3}
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="Nama Resto & Alamat Lengkap..."
              />
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Muncul paling atas pada struk cetak & thermal bluetooth.</p>
            </div>

            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Footer Struk (Bawah)</label>
              <textarea
                rows={3}
                value={footerInput}
                onChange={(e) => setFooterInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="Pesan Penutup & Media Sosial..."
              />
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">Muncul paling bawah pada struk cetak & thermal bluetooth.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
            <Percent className="w-4 h-4 text-coffee-500" /> Tarif Pajak & Biaya Bawaan
          </h3>

          <div>
            <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-100/70 dark:hover:bg-stone-800 transition mb-3">
              <input
                type="checkbox"
                checked={enableTaxInput}
                onChange={(e) => setEnableTaxInput(e.target.checked)}
                className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-xs text-stone-800 dark:text-stone-100 block">Aktifkan Pajak Resto (PB1)</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Hitung & tampilkan pajak pada transaksi kasir serta struk pencetakan.</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Tarif Pajak (%)</label>
              <input
                type="number"
                value={taxInput}
                onChange={(e) => setTaxInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Biaya Layanan (%)</label>
              <input
                type="number"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
            <Printer className="w-4 h-4 text-coffee-500" /> Pengaturan Printer Termal & Bluetooth ESC/POS
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Printer Struk Aktif</label>
              <select className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl font-medium focus:outline-none">
                <option>Bluetooth Thermal Printer 58mm / 80mm (ESC/POS Auto-Connect)</option>
                <option>Epson TM-T82 Thermal Printer (USB/LAN)</option>
                <option>Star Micronics TSP100</option>
              </select>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-100">Printer Bluetooth Tersimpan</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">Kasir otomatis terhubung ke printer tanpa perlu memilih ulang setiap kali cetak.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  printerService.forgetSavedPrinter();
                  alert('Printer tersimpan berhasil direset. Kasir akan diminta memilih printer pada pencetakan berikutnya.');
                }}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg font-bold border border-red-200 dark:border-red-800 transition"
              >
                Reset Bluetooth Printer
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-coffee-500 hover:bg-coffee-600 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Simpan Konfigurasi Sistem
        </button>

      </form>

      {/* SUCCESS MODAL DIALOG */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">Pengaturan Berhasil Disimpan!</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Konfigurasi outlet, kustomisasi struk, tarif pajak, dan lokasi geofencing GPS telah berhasil diperbarui.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md transition"
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
