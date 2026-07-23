import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Download } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'product' | 'profit'>('daily');

  const totalRevenue = sales.reduce((acc, s) => acc + s.grand_total, 0);
  const totalCogs = sales.reduce((acc, s) => acc + s.total_cogs, 0);
  const netProfit = totalRevenue - totalCogs;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">Laporan Keuangan & Penjualan</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Laporan transaksi harian, performa produk, dan rincian laba rugi</p>
        </div>

        <button 
          onClick={() => window.print()} 
          className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" />
          Ekspor Laporan
        </button>
      </div>

      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        {[
          { id: 'daily', label: 'Laporan Penjualan Harian' },
          { id: 'product', label: 'Penjualan per Produk' },
          { id: 'profit', label: 'Laporan Laba Rugi' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              reportType === t.id 
                ? 'bg-coffee-500 text-white shadow-xs' 
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {reportType === 'profit' ? (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 max-w-xl space-y-4 shadow-sm">
          <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-3">Ringkasan Laba Rugi</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
              <span>Pendapatan Kotor:</span>
              <span className="font-bold text-stone-800 dark:text-stone-100">Rp {totalRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-1 text-red-600 dark:text-red-400">
              <span>Harga Pokok Penjualan (HPP):</span>
              <span className="font-bold">-Rp {totalCogs.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-stone-200 dark:border-stone-800 font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
              <span>LABA OPERASIONAL BERSIH:</span>
              <span>Rp {netProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
              <tr>
                <th className="p-3">No. Struk / Item</th>
                <th className="p-3">Kasir</th>
                <th className="p-3">Total Akhir</th>
                <th className="p-3">HPP</th>
                <th className="p-3">Laba</th>
                <th className="p-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {sales.map((s) => {
                const profit = s.grand_total - s.total_cogs;
                return (
                  <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="p-3 font-bold font-mono text-coffee-600 dark:text-coffee-400">{s.receipt_number}</td>
                    <td className="p-3 text-stone-700 dark:text-stone-300">{s.cashier_name}</td>
                    <td className="p-3 font-bold text-stone-800 dark:text-stone-100">Rp {s.grand_total.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-stone-500 dark:text-stone-400">Rp {s.total_cogs.toLocaleString('id-ID')}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Rp {profit.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-stone-400 dark:text-stone-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

