import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { Filter, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, attendances, fetchAttendances } = useAppStore();
  const [reportType, setReportType] = useState<'daily' | 'product' | 'profit' | 'attendance'>('daily');
  
  // Date Range Filter States (default to current month start & today)
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Pagination State (25 items per page)
  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination to page 1 whenever filters or tabs change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, reportType]);

  React.useEffect(() => {
    fetchAttendances(startDate, endDate);
  }, [startDate, endDate]);

  // Quick Preset Helper
  const applyPreset = (preset: 'today' | '7days' | 'thisMonth' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.setDate(now.getDate() - 7));
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      setStartDate(firstDayOfMonthStr);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter Sales by Date Range
  const filteredSales = sales.filter((s) => {
    if (!s.created_at) return true;
    const saleDateStr = s.created_at.slice(0, 10);
    if (startDate && saleDateStr < startDate) return false;
    if (endDate && saleDateStr > endDate) return false;
    return true;
  });

  // Calculate Profit & COGS based on filtered sales
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grand_total, 0);
  const totalCogs = filteredSales.reduce((acc, s) => acc + s.total_cogs, 0);
  const netProfit = totalRevenue - totalCogs;

  // Aggregate Product Performance Report
  const productPerformanceMap: Record<string, { name: string; category: string; qty: number; revenue: number; cogs: number }> = {};
  filteredSales.forEach((s) => {
    if (s.items) {
      s.items.forEach((item: any) => {
        const pId = item.product_id || item.product_name;
        if (!productPerformanceMap[pId]) {
          productPerformanceMap[pId] = {
            name: item.product_name || 'Produk',
            category: item.category || 'Umum',
            qty: 0,
            revenue: 0,
            cogs: 0,
          };
        }
        productPerformanceMap[pId].qty += item.quantity || 0;
        productPerformanceMap[pId].revenue += item.total_price || (item.unit_price * item.quantity) || 0;
        productPerformanceMap[pId].cogs += (item.unit_cost || 0) * item.quantity;
      });
    }
  });

  const productPerformanceList = Object.values(productPerformanceMap).sort((a, b) => b.revenue - a.revenue);

  // Paginated Slices
  const totalItemsCount = 
    reportType === 'daily' ? filteredSales.length :
    reportType === 'product' ? productPerformanceList.length :
    reportType === 'attendance' ? attendances.length : 0;

  const totalPages = Math.ceil(totalItemsCount / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedSales = filteredSales.slice(startIndex, endIndex);
  const paginatedProducts = productPerformanceList.slice(startIndex, endIndex);
  const paginatedAttendances = attendances.slice(startIndex, endIndex);

  // Excel Export Handler
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    if (reportType === 'daily') {
      const exportData = filteredSales.map((s, idx) => ({
        'No': idx + 1,
        'No Struk': s.receipt_number,
        'Tanggal & Waktu': new Date(s.created_at).toLocaleString('id-ID'),
        'Nama Kasir': s.cashier_name,
        'Nama Pelanggan': s.customer_name || 'Pelanggan Umum',
        'Tipe Pesanan': s.order_type === 'dine_in' ? `Dine In (Meja ${s.table_number || '-'})` : 'Take Away',
        'Metode Pembayaran': s.payments?.[0]?.method?.toUpperCase() || 'CASH',
        'Subtotal (Rp)': s.subtotal,
        'Diskon (Rp)': s.discount_amount,
        'Pajak (Rp)': s.tax_amount,
        'Service Charge (Rp)': s.service_charge,
        'Total Akhir (Rp)': s.grand_total,
        'Total HPP (Rp)': s.total_cogs,
        'Laba Bersih (Rp)': s.grand_total - s.total_cogs,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Penjualan Harian');
      XLSX.writeFile(workbook, `Laporan_Penjualan_Harian_${startDate || 'Awal'}_s.d_${endDate || 'Akhir'}.xlsx`);

    } else if (reportType === 'product') {
      const exportData = productPerformanceList.map((p, idx) => ({
        'No': idx + 1,
        'Nama Produk': p.name,
        'Total Terjual (Qty)': p.qty,
        'Total Pendapatan (Rp)': p.revenue,
        'Total HPP (Rp)': p.cogs,
        'Laba Kotor (Rp)': p.revenue - p.cogs,
        'Margin (%)': p.revenue > 0 ? `${Math.round(((p.revenue - p.cogs) / p.revenue) * 100)}%` : '0%',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Penjualan Per Produk');
      XLSX.writeFile(workbook, `Laporan_Penjualan_Produk_${startDate || 'Awal'}_s.d_${endDate || 'Akhir'}.xlsx`);

    } else if (reportType === 'attendance') {
      const exportData = attendances.map((a, idx) => ({
        'No': idx + 1,
        'Tanggal': a.date,
        'Nama Karyawan': a.employee_name,
        'Jam Masuk (Clock In)': a.clock_in ? new Date(a.clock_in).toLocaleTimeString('id-ID') : '-',
        'Jam Pulang (Clock Out)': a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : '-',
        'Jarak dari Outlet (m)': a.distance_meters || 0,
        'Validasi GPS': a.is_valid_location ? 'VALID (Di Area)' : 'DILUAR AREA',
        'Catatan': a.notes || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Absensi Karyawan');
      XLSX.writeFile(workbook, `Laporan_Absensi_Karyawan_${startDate || 'Awal'}_s.d_${endDate || 'Akhir'}.xlsx`);

    } else {
      const exportData = [
        { 'Keterangan': 'Periode Laporan', 'Nilai': `${startDate || 'Semua'} s/d ${endDate || 'Semua'}` },
        { 'Keterangan': 'Jumlah Transaksi', 'Nilai': filteredSales.length },
        { 'Keterangan': 'Pendapatan Kotor (Omzet)', 'Nilai': totalRevenue },
        { 'Keterangan': 'Total Harga Pokok Penjualan (HPP)', 'Nilai': totalCogs },
        { 'Keterangan': 'LABA OPERASIONAL BERSIH', 'Nilai': netProfit },
      ];

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Laba Rugi');
      XLSX.writeFile(workbook, `Laporan_Laba_Rugi_${startDate || 'Awal'}_s.d_${endDate || 'Akhir'}.xlsx`);
    }
  };

  const renderPaginationControls = () => {
    if (reportType === 'profit' || totalItemsCount <= ITEMS_PER_PAGE) return null;

    const fromItem = Math.min(startIndex + 1, totalItemsCount);
    const toItem = Math.min(endIndex, totalItemsCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-stone-900 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs shadow-xs">
        <div className="text-stone-500 dark:text-stone-400 font-medium">
          Menampilkan <span className="font-bold text-stone-800 dark:text-stone-200">{fromItem}</span> - <span className="font-bold text-stone-800 dark:text-stone-200">{toItem}</span> dari <span className="font-bold text-stone-800 dark:text-stone-200">{totalItemsCount}</span> data (25 per halaman)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prevP = arr[idx - 1];
                const showEllipsis = prevP && p - prevP > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-stone-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        currentPage === p
                          ? 'bg-coffee-500 text-white shadow-xs'
                          : 'border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">Laporan Keuangan & Penjualan</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Laporan transaksi harian, performa produk, dan rincian laba rugi</p>
        </div>

        <button 
          onClick={handleExportExcel} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Excel (.xlsx)
        </button>
      </div>

      {/* Filter Bar: Date Range Controls & Presets */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-200">
          <Filter className="w-4 h-4 text-coffee-500" />
          <span>Filter Periode Tanggal:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-medium">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-medium">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => applyPreset('today')}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-lg transition"
            >
              Hari Ini
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-lg transition"
            >
              7 Hari
            </button>
            <button
              onClick={() => applyPreset('thisMonth')}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-lg transition"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-lg transition"
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto">
        {[
          { id: 'daily', label: `Penjualan Harian (${filteredSales.length})` },
          { id: 'product', label: `Penjualan per Produk (${productPerformanceList.length})` },
          { id: 'profit', label: 'Laporan Laba Rugi' },
          { id: 'attendance', label: `Absensi Karyawan (${attendances.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              reportType === t.id 
                ? 'bg-coffee-500 text-white shadow-xs' 
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {reportType === 'profit' ? (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 max-w-xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-3">
            <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">Ringkasan Laba Rugi</h2>
            <span className="text-[10px] font-bold text-coffee-600 dark:text-coffee-400 bg-coffee-50 dark:bg-coffee-950/40 px-2 py-1 rounded-md">
              {startDate || 'Awal'} s.d {endDate || 'Sekarang'}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
              <span>Total Transaksi Berhasil:</span>
              <span className="font-bold text-stone-800 dark:text-stone-100">{filteredSales.length} Transaksi</span>
            </div>
            <div className="flex justify-between py-1 text-stone-600 dark:text-stone-300">
              <span>Pendapatan Kotor (Omzet):</span>
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
      ) : reportType === 'product' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center">Total Terjual (Qty)</th>
                    <th className="p-3">Total Pendapatan</th>
                    <th className="p-3">Total HPP</th>
                    <th className="p-3">Laba Kotor</th>
                    <th className="p-3">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-stone-400">
                        Tidak ada transaksi produk pada periode tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p, idx) => {
                      const profit = p.revenue - p.cogs;
                      const marginPct = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                          <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{p.name}</td>
                          <td className="p-3 text-center font-bold text-coffee-600 dark:text-coffee-400">{p.qty}</td>
                          <td className="p-3 font-bold text-stone-800 dark:text-stone-100">Rp {p.revenue.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-stone-500 dark:text-stone-400">Rp {p.cogs.toLocaleString('id-ID')}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Rp {profit.toLocaleString('id-ID')}</td>
                          <td className="p-3 font-bold text-stone-700 dark:text-stone-300">{marginPct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {renderPaginationControls()}
        </div>
      ) : reportType === 'attendance' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Nama Karyawan</th>
                    <th className="p-3">Jam Masuk (Clock In)</th>
                    <th className="p-3">Jam Pulang (Clock Out)</th>
                    <th className="p-3">Jarak dari Outlet</th>
                    <th className="p-3">Status GPS</th>
                    <th className="p-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {paginatedAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-stone-400">
                        Belum ada data absensi untuk rentang tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendances.map((a) => (
                      <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                        <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{a.date}</td>
                        <td className="p-3 font-bold text-coffee-600 dark:text-coffee-400">{a.employee_name}</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {a.clock_in ? new Date(a.clock_in).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">
                          {a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                          {a.distance_meters || 0} m
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            a.is_valid_location
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          }`}>
                            {a.is_valid_location ? 'Valid (Di Area)' : 'Di Luar Area'}
                          </span>
                        </td>
                        <td className="p-3 text-stone-400 dark:text-stone-500">{a.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {renderPaginationControls()}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">No. Struk</th>
                    <th className="p-3">Kasir</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Total Akhir</th>
                    <th className="p-3">HPP</th>
                    <th className="p-3">Laba</th>
                    <th className="p-3">Tanggal & Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-stone-400">
                        Tidak ada transaksi ditemukan untuk rentang tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((s) => {
                      const profit = s.grand_total - s.total_cogs;
                      return (
                        <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                          <td className="p-3 font-bold font-mono text-coffee-600 dark:text-coffee-400">{s.receipt_number}</td>
                          <td className="p-3 text-stone-700 dark:text-stone-300">{s.cashier_name}</td>
                          <td className="p-3 text-stone-600 dark:text-stone-400">{s.customer_name || 'Pelanggan Umum'}</td>
                          <td className="p-3 font-bold text-stone-800 dark:text-stone-100">Rp {s.grand_total.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-stone-500 dark:text-stone-400">Rp {s.total_cogs.toLocaleString('id-ID')}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Rp {profit.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-stone-400 dark:text-stone-500">{new Date(s.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {renderPaginationControls()}
        </div>
      )}
    </div>
  );
};

