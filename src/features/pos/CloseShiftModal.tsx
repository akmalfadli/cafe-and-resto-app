import React, { useState, useEffect } from 'react';
import { X, Wallet, TrendingUp, Receipt, Clock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, onClose }) => {
  const { activeShift, sales, closeShift, logout } = useAppStore();
  const [endingCash, setEndingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shift summary calculations
  const shiftSales = sales.filter(
    (s) => s.shift_id === activeShift?.id && s.status === 'completed'
  );
  const totalRevenue = shiftSales.reduce((sum, s) => sum + Number(s.grand_total), 0);
  const cashRevenue = shiftSales.reduce((sum, s) => {
    const cashPay = s.payments?.find((p) => p.method === 'cash');
    return sum + (cashPay ? (cashPay.amount - (cashPay.change_amount || 0)) : 0);
  }, 0);
  const startingCash = activeShift?.starting_cash || 0;
  const expectedCash = startingCash + cashRevenue;
  const endingCashNum = parseFloat(endingCash.replace(/\./g, '').replace(',', '.')) || 0;
  const difference = endingCashNum - expectedCash;

  // Duration
  const openedAt = activeShift?.opened_at ? new Date(activeShift.opened_at) : null;
  const durationMs = openedAt ? Date.now() - openedAt.getTime() : 0;
  const durationHours = Math.floor(durationMs / 3600000);
  const durationMins = Math.floor((durationMs % 3600000) / 60000);

  useEffect(() => {
    if (!isOpen) {
      setEndingCash('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const formatCurrency = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('id-ID');
  };

  const handleClose = async () => {
    const amount = parseFloat(endingCash.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      setError('Masukkan jumlah uang fisik yang valid.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await closeShift(amount, notes || undefined);
      await logout();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm font-sans p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Tutup Shift Kasir</h2>
            <p className="text-stone-400 text-xs mt-0.5">{activeShift?.cashier_name} · {durationHours}j {durationMins}m</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Shift Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500 text-xs">Durasi Shift</span>
              </div>
              <p className="font-bold text-stone-800">{durationHours}j {durationMins}m</p>
            </div>
            <div className="bg-stone-50 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-stone-500 text-xs">Total Transaksi</span>
              </div>
              <p className="font-bold text-stone-800">{shiftSales.length} order</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-stone-500 text-xs">Total Pendapatan</span>
              </div>
              <p className="font-bold text-emerald-700 text-sm">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-stone-500 text-xs">Ekspektasi Kas</span>
              </div>
              <p className="font-bold text-blue-700 text-sm">Rp {expectedCash.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Expected breakdown */}
          <div className="bg-stone-50 rounded-2xl px-4 py-3 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-500">
              <span>Modal Awal</span>
              <span className="font-semibold text-stone-700">Rp {startingCash.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>+ Penerimaan Tunai</span>
              <span className="font-semibold text-stone-700">Rp {cashRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-stone-800">
              <span>= Ekspektasi di Laci</span>
              <span>Rp {expectedCash.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Ending Cash Input */}
          <div>
            <label className="block text-stone-700 text-sm font-semibold mb-2">
              Uang Fisik di Laci (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={endingCash}
                onChange={(e) => setEndingCash(formatCurrency(e.target.value))}
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-stone-100 border border-stone-200 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/20 rounded-2xl text-stone-900 text-lg font-bold outline-none transition"
              />
            </div>

            {/* Difference indicator */}
            {endingCash && (
              <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                Math.abs(difference) < 1000
                  ? 'bg-emerald-50 text-emerald-700'
                  : difference > 0
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-red-50 text-red-700'
              }`}>
                {Math.abs(difference) < 1000 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  Selisih: {difference >= 0 ? '+' : ''}Rp {difference.toLocaleString('id-ID')}
                  {Math.abs(difference) < 1000 ? ' (Pas)' : difference > 0 ? ' (Lebih)' : ' (Kurang)'}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-stone-700 text-sm font-semibold mb-2">
              Catatan Penutup <span className="text-stone-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Printer sempat mati, ada return 1 item, dll..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-stone-100 border border-stone-200 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/20 rounded-2xl text-stone-800 text-sm outline-none transition resize-none placeholder:text-stone-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleClose}
              disabled={isLoading || !endingCash}
              className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/20"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menutup...</>
              ) : (
                'Tutup Shift'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
