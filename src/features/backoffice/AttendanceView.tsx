import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { Clock, FileSpreadsheet, CheckCircle2, XCircle, Search } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { attendances, fetchAttendances } = useAppStore();
  const [search, setSearch] = useState('');

  // Date Range Filter States
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => {
    fetchAttendances(startDate, endDate);
  }, [startDate, endDate]);

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

  const filteredAttendances = attendances.filter((a) => {
    const matchesSearch = a.employee_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalAttendances = filteredAttendances.length;
  const validLocationCount = filteredAttendances.filter((a) => a.is_valid_location).length;
  const invalidLocationCount = totalAttendances - validLocationCount;

  const handleExportExcel = () => {
    const exportData = filteredAttendances.map((a, idx) => ({
      'No': idx + 1,
      'Tanggal': a.date,
      'Nama Karyawan': a.employee_name,
      'Jam Masuk (Clock In)': a.clock_in ? new Date(a.clock_in).toLocaleTimeString('id-ID') : '-',
      'Jam Pulang (Clock Out)': a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : 'Belum Pulang',
      'Jarak dari Outlet (m)': a.distance_meters || 0,
      'Status Validasi GPS': a.is_valid_location ? 'VALID (Di Area)' : 'DILUAR AREA',
      'Catatan': a.notes || '-',
    }));

    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Data Kehadiran');
    XLSX.writeFile(workbook, `Laporan_Kehadiran_Karyawan_${startDate || 'Awal'}_s.d_${endDate || 'Sekarang'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <Clock className="w-7 h-7 text-coffee-500" /> Daftar Kehadiran & Absensi Karyawan
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Monitor jam masuk/pulang staf, catatan kerja, dan verifikasi radius geofencing GPS
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Excel (.xlsx)
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-50 dark:bg-coffee-950/40 text-coffee-600 dark:text-coffee-400 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Absensi Recorded</p>
            <p className="text-xl font-extrabold text-stone-800 dark:text-stone-100">{totalAttendances} Hari Kerja</p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Absen Valid (Di Area Outlet)</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{validLocationCount} Absensi</p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Di Luar Radius Outlet</p>
            <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{invalidLocationCount} Terdeteksi</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 text-xs font-semibold rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-coffee-500"
          />
        </div>

        {/* Date Filter & Presets */}
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

      {/* Table Data */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Nama Karyawan</th>
                <th className="p-3">Jam Masuk (Clock In)</th>
                <th className="p-3">Jam Pulang (Clock Out)</th>
                <th className="p-3">Jarak dari Outlet</th>
                <th className="p-3">Status Validasi GPS</th>
                <th className="p-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Belum ada riwayat absensi untuk kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                    <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{a.date}</td>
                    <td className="p-3 font-bold text-coffee-600 dark:text-coffee-400 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-coffee-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {a.employee_name.charAt(0)}
                      </div>
                      <span>{a.employee_name}</span>
                    </td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      {a.clock_in ? new Date(a.clock_in).toLocaleTimeString('id-ID') : '-'}
                    </td>
                    <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">
                      {a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : 'Belum Pulang'}
                    </td>
                    <td className="p-3 font-mono text-stone-700 dark:text-stone-300">
                      {a.distance_meters || 0} meter
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        a.is_valid_location
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {a.is_valid_location ? (
                          <><CheckCircle2 className="w-3 h-3" /> Valid (Di Area)</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Di Luar Area</>
                        )}
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
    </div>
  );
};
