import React, { useState, useMemo } from 'react';
import { Coffee, Clock, Wallet, ArrowRight, Loader2, AlertCircle, ChevronDown, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Profile } from '../../types';

export const ShiftGateScreen: React.FC = () => {
  const { profiles, openShift } = useAppStore();

  // Only Cashier and Manager can run a shift
  const eligibleStaff = useMemo(
    () => profiles.filter((p) => p.is_active && (p.role === 'Cashier' || p.role === 'Manager')),
    [profiles]
  );

  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(eligibleStaff[0] || null);
  const [startingCash, setStartingCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep selectedProfile in sync if profiles load after mount
  React.useEffect(() => {
    if (!selectedProfile && eligibleStaff.length > 0) {
      setSelectedProfile(eligibleStaff[0]);
    }
  }, [eligibleStaff]);

  const handleOpenShift = async () => {
    if (!selectedProfile) {
      setError('Pilih kasir yang akan membuka shift.');
      return;
    }
    const amount = parseFloat(startingCash.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      setError('Masukkan jumlah modal awal yang valid.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await openShift(amount, selectedProfile.id);
    } catch (err: any) {
      setError(err.message || 'Gagal membuka shift. Coba lagi.');
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('id-ID');
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex items-center justify-center font-sans">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #d97706 0, #d97706 1px, transparent 0, transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-coffee-500 text-white p-3 rounded-2xl shadow-lg shadow-coffee-500/30">
              <Coffee className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-white font-black text-2xl tracking-wider">CafePOS</h1>
              <span className="text-stone-400 text-xs font-semibold tracking-widest uppercase">Sistem Kasir</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Belum Ada Shift Aktif
            </div>
            <h2 className="text-white font-bold text-xl mb-1">Buka Shift Kasir</h2>
            <p className="text-stone-400 text-sm">Pilih kasir dan masukkan modal awal di laci</p>
          </div>

          {/* Waktu */}
          <div className="bg-stone-800/60 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-stone-400">
              <Clock className="w-4 h-4" />
              <span>Waktu Buka</span>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{timeStr}</p>
              <p className="text-stone-400 text-xs">{dateStr}</p>
            </div>
          </div>

          {/* Cashier Selector */}
          <div className="mb-4">
            <label className="block text-stone-300 text-sm font-semibold mb-2">
              <User className="w-4 h-4 inline-block mr-1.5 text-coffee-400" />
              Pilih Kasir / Manager
            </label>

            {eligibleStaff.length === 0 ? (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Belum ada Kasir atau Manager terdaftar. Tambah staff di Back Office → Pengguna.</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedProfile?.id || ''}
                  onChange={(e) => {
                    const found = eligibleStaff.find((p) => p.id === e.target.value) || null;
                    setSelectedProfile(found);
                  }}
                  className="w-full appearance-none bg-stone-800 border border-stone-700 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/20 rounded-2xl text-white font-semibold text-sm px-4 py-3 outline-none transition pr-10 cursor-pointer"
                >
                  {eligibleStaff.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} — {p.role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            )}

            {/* Selected profile badge */}
            {selectedProfile && (
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-stone-800/40 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-coffee-500/20 text-coffee-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {selectedProfile.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{selectedProfile.full_name}</p>
                  <p className="text-coffee-400 text-[10px]">{selectedProfile.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Starting Cash Input */}
          <div className="mb-5">
            <label className="block text-stone-300 text-sm font-semibold mb-2">
              <Wallet className="w-4 h-4 inline-block mr-1.5 text-coffee-400" />
              Modal Awal (Uang di Laci)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={startingCash}
                onChange={(e) => setStartingCash(formatCurrency(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenShift()}
                className="w-full pl-12 pr-4 py-3 bg-stone-800 border border-stone-700 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/20 rounded-2xl text-white text-lg font-bold outline-none transition placeholder:text-stone-600"
              />
            </div>
            <p className="text-stone-500 text-[10px] mt-1.5 pl-1">Masukkan 0 jika tidak ada modal awal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleOpenShift}
            disabled={isLoading || !selectedProfile}
            className="w-full bg-coffee-500 hover:bg-coffee-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-coffee-500/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Membuka Shift...
              </>
            ) : (
              <>
                <span>Buka Shift &amp; Mulai Kasir</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-stone-600 text-xs mt-6">
          Shift akan otomatis tercatat di laporan Back Office → Shift Kasir
        </p>
      </div>
    </div>
  );
};
