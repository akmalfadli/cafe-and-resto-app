import React, { useState, useEffect } from 'react';
import { Clock, DoorOpen, TrendingUp, Wallet, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { dbService } from '../../services/dbService';
import type { CashShift } from '../../types';

interface ShiftWithSummary extends CashShift {
  total_transactions?: number;
  total_revenue?: number;
}

const formatDuration = (openedAt: string, closedAt?: string) => {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const ms = end - start;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}j ${m}m`;
};

export const ShiftsView: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftWithSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaryCache, setSummaryCache] = useState<Record<string, { total_transactions: number; total_revenue: number }>>({});

  const loadShifts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dbService.getShifts(100);
      setShifts(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data shift.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleExpand = async (shift: CashShift) => {
    if (expandedId === shift.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(shift.id);
    if (!summaryCache[shift.id]) {
      try {
        const summary = await dbService.getShiftSalesSummary(shift.id);
        setSummaryCache((prev) => ({ ...prev, [shift.id]: summary }));
      } catch {
        // ignore
      }
    }
  };

  const totalRevenue = shifts.filter((s) => s.status === 'closed').reduce((sum, s) => sum + (summaryCache[s.id]?.total_revenue || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-coffee-500" />
        <span className="ml-3 text-stone-500 text-sm">Memuat histori shift...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Shift Kasir</h1>
          <p className="text-stone-500 text-sm mt-0.5">Histori buka &amp; tutup shift seluruh kasir</p>
        </div>
        <button
          onClick={loadShifts}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 text-sm font-semibold transition border border-stone-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-xs font-semibold mb-1">Total Shift</p>
          <p className="text-2xl font-black text-stone-800">{shifts.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-xs font-semibold mb-1">Shift Aktif</p>
          <p className="text-2xl font-black text-emerald-600">{shifts.filter((s) => s.status === 'open').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-xs font-semibold mb-1">Total Pendapatan (Tercatat)</p>
          <p className="text-lg font-black text-coffee-700">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Shift List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {shifts.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Belum ada data shift</p>
            <p className="text-xs mt-1">Shift akan muncul setelah kasir membuka shift pertama</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-5 py-3 bg-stone-50 text-xs font-bold text-stone-500 uppercase tracking-wide">
              <div className="col-span-2">Kasir</div>
              <div>Waktu Buka</div>
              <div>Durasi</div>
              <div>Modal Awal</div>
              <div>Status</div>
            </div>

            {shifts.map((shift) => {
              const isExpanded = expandedId === shift.id;
              const summary = summaryCache[shift.id];
              const diff = shift.ending_cash != null && shift.expected_cash != null
                ? shift.ending_cash - shift.expected_cash
                : null;

              return (
                <div key={shift.id}>
                  <button
                    className="w-full grid grid-cols-6 px-5 py-4 text-left hover:bg-stone-50 transition items-center"
                    onClick={() => handleExpand(shift)}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-coffee-100 text-coffee-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {shift.cashier_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-800 text-sm">{shift.cashier_name}</p>
                        <p className="text-stone-400 text-xs truncate max-w-[130px]">{shift.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="text-stone-600 text-sm">
                      <p className="font-medium">{new Date(shift.opened_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-stone-400">{new Date(shift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-stone-600 text-sm font-medium">
                      {shift.status === 'open' ? (
                        <span className="text-emerald-600">{formatDuration(shift.opened_at)}</span>
                      ) : (
                        formatDuration(shift.opened_at, shift.closed_at)
                      )}
                    </div>
                    <div className="text-stone-700 text-sm font-semibold">
                      Rp {(shift.starting_cash || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        shift.status === 'open'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {shift.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {shift.status === 'open' ? 'Aktif' : 'Selesai'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 bg-stone-50 border-t border-stone-100">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div className="bg-white rounded-xl p-3.5 border border-stone-200">
                          <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Waktu Tutup
                          </p>
                          <p className="font-semibold text-stone-800 text-sm">
                            {shift.closed_at
                              ? new Date(shift.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3.5 border border-stone-200">
                          <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Kas Akhir
                          </p>
                          <p className="font-semibold text-stone-800 text-sm">
                            {shift.ending_cash != null ? `Rp ${shift.ending_cash.toLocaleString('id-ID')}` : '—'}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3.5 border border-stone-200">
                          <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Total Pendapatan
                          </p>
                          {summary ? (
                            <p className="font-semibold text-emerald-700 text-sm">
                              Rp {summary.total_revenue.toLocaleString('id-ID')}
                              <span className="text-stone-400 text-xs ml-1">({summary.total_transactions} order)</span>
                            </p>
                          ) : (
                            <p className="text-stone-400 text-xs">Memuat...</p>
                          )}
                        </div>
                        <div className={`rounded-xl p-3.5 border ${
                          diff == null ? 'bg-white border-stone-200' :
                          Math.abs(diff) < 1000 ? 'bg-emerald-50 border-emerald-200' :
                          diff > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                            <DoorOpen className="w-3 h-3" /> Selisih Kas
                          </p>
                          <p className={`font-bold text-sm ${
                            diff == null ? 'text-stone-400' :
                            Math.abs(diff) < 1000 ? 'text-emerald-700' :
                            diff > 0 ? 'text-blue-700' : 'text-red-700'
                          }`}>
                            {diff == null ? '—' : `${diff >= 0 ? '+' : ''}Rp ${diff.toLocaleString('id-ID')}`}
                          </p>
                        </div>
                      </div>

                      {shift.notes && (
                        <div className="mt-3 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-600">
                          <span className="font-semibold text-stone-500 text-xs uppercase tracking-wide">Catatan: </span>
                          {shift.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
