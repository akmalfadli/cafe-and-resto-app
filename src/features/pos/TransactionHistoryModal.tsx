import React, { useState } from 'react';
import { 
  History, Search, Printer, Clock, DollarSign, 
  CreditCard, QrCode, X, Eye, FileText, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Sale } from '../../types';
import { printerService } from '../../services/printerService';
import { toCapitalCase } from '../../utils/formatters';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose }) => {
  const sales = useAppStore(s => s.sales);
  const updateSaleStatus = useAppStore(s => s.updateSaleStatus);
  const receiptHeader = useAppStore(s => s.receiptHeader);
  const receiptFooter = useAppStore(s => s.receiptFooter);
  const receiptLogo = useAppStore(s => s.receiptLogo);
  const enableTableNumber = useAppStore(s => s.enableTableNumber);
  const taxRate = useAppStore(s => s.taxRate);
  const serviceRate = useAppStore(s => s.serviceRate);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'qris' | 'transfer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'preparing' | 'ready' | 'completed'>('all');

  if (!isOpen) return null;

  // Sync selectedSale with updated store sale state
  const activeSelectedSale = selectedSale ? (sales.find(s => s.id === selectedSale.id) || selectedSale) : null;

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sale.cashier_name && sale.cashier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sale.table_number && sale.table_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = 
      filterPayment === 'all' || 
      (sale.payments && sale.payments.some(p => p.method === filterPayment));

    const currentStatus = sale.status || 'completed';
    const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const handlePrint = async (sale: Sale) => {
    await printerService.printViaBluetooth(
      sale, 
      receiptHeader, 
      receiptFooter, 
      enableTableNumber, 
      receiptLogo
    );
  };

  const handleMarkAsFinished = async (saleId: string) => {
    await updateSaleStatus(saleId, 'completed');
  };

  const getOrderStatusBadge = (status?: string) => {
    const s = status || 'completed';
    switch (s) {
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" /> Sedang Disiapkan
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="w-3 h-3" /> Siap Diambil
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Selesai / Diambil
          </span>
        );
    }
  };

  const getPaymentBadge = (sale: Sale) => {
    const method = sale.payments?.[0]?.method || 'cash';
    switch (method) {
      case 'qris':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"><QrCode className="w-3 h-3" /> QRIS</span>;
      case 'transfer':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><CreditCard className="w-3 h-3" /> Transfer</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><DollarSign className="w-3 h-3" /> Tunai</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col h-[90vh] max-h-[750px]">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-coffee-500/20 text-coffee-400 rounded-xl border border-coffee-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Riwayat Transaksi & Status Pesanan</h2>
              <p className="text-[10px] sm:text-xs text-stone-400">
                Daftar semua transaksi penjualan, status persiapan, dan verifikasi pengambilan pesanan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Split view if sale selected) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left / Main List View */}
          <div className={`flex-1 flex flex-col overflow-hidden ${activeSelectedSale ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Filter & Search Bar */}
            <div className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari Struk, Pelanggan, Kasir..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-stone-800 dark:text-stone-100"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status & Method Filter Tabs */}
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="preparing">Sedang Disiapkan</option>
                  <option value="ready">Siap Diambil</option>
                  <option value="completed">Selesai / Diambil</option>
                </select>

                {/* Method Filter */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Semua Bayar' },
                    { id: 'cash', label: 'Tunai' },
                    { id: 'qris', label: 'QRIS' },
                    { id: 'transfer', label: 'Transfer' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterPayment(tab.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                        filterPayment === tab.id
                          ? 'bg-coffee-500 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sales Table / List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredSales.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
                  <FileText className="w-12 h-12 mb-3 stroke-[1.5] text-stone-300 dark:text-stone-700" />
                  <p className="font-bold text-sm text-stone-600 dark:text-stone-400">Tidak ada riwayat transaksi</p>
                  <p className="text-xs text-stone-400 mt-1">Transaksi yang sesuai filter akan muncul di sini.</p>
                </div>
              ) : (
                filteredSales.map(sale => {
                  const isSelected = activeSelectedSale?.id === sale.id;
                  const totalItems = (sale.items || []).reduce((acc, item) => acc + item.quantity, 0);

                  return (
                    <div
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-coffee-500 bg-coffee-50/50 dark:bg-coffee-950/20 shadow-sm'
                          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 font-mono">
                            {sale.receipt_number}
                          </span>
                          {getOrderStatusBadge(sale.status)}
                          {getPaymentBadge(sale)}
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            {sale.order_type === 'dine_in' ? (enableTableNumber && sale.table_number ? `Meja ${sale.table_number}` : 'Dine In') : sale.order_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700 dark:text-stone-300">{sale.customer_name || 'Pelanggan'}</span>
                          <span>•</span>
                          <span>{totalItems} item</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div className="text-xs font-black text-coffee-600 dark:text-coffee-400">
                            Rp {sale.grand_total.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(sale.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>

                        {sale.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsFinished(sale.id);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-[10px] shadow transition flex items-center gap-1"
                            title="Tandai Pesanan Telah Selesai & Diambil"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai
                          </button>
                        )}

                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* List Footer Counter */}
            <div className="p-3 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex justify-between items-center">
              <span>Total Transaksi: <strong>{filteredSales.length}</strong></span>
              <span>Total Pendapatan: <strong className="text-emerald-600 dark:text-emerald-400">Rp {filteredSales.reduce((sum, s) => sum + s.grand_total, 0).toLocaleString('id-ID')}</strong></span>
            </div>
          </div>

          {/* Right Receipt Preview Pane */}
          {activeSelectedSale && (
            <div className="w-full md:w-[380px] bg-stone-50 dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col h-full">
              
              {/* Detail Header */}
              <div className="p-3 bg-stone-200/60 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-coffee-500" /> Struk #{activeSelectedSale.receipt_number}
                </span>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-1 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thermal Receipt Paper Mockup */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                
                {/* Status Notification Box & Control */}
                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Status Pesanan saat ini</span>
                    {getOrderStatusBadge(activeSelectedSale.status)}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-850">
                    <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 shrink-0">Ubah Status:</span>
                    <select
                      value={activeSelectedSale.status || 'completed'}
                      onChange={(e) => updateSaleStatus(activeSelectedSale.id, e.target.value as any)}
                      className="w-full bg-stone-50 dark:bg-stone-800 text-stone-850 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                    >
                      <option value="preparing">⏳ Sedang Disiapkan</option>
                      <option value="ready">🛎️ Siap Diambil</option>
                      <option value="completed">✅ Selesai / Diambil</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm font-mono text-xs text-stone-800 dark:text-stone-200 space-y-3">
                  
                  {/* Receipt Header */}
                  <div className="text-center border-b border-dashed border-stone-300 dark:border-stone-700 pb-3 whitespace-pre-line font-bold">
                    {receiptLogo && (
                      <img src={receiptLogo} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2" />
                    )}
                    {receiptHeader}
                  </div>

                  {/* Transaction Meta */}
                  <div className="space-y-1 text-[11px]">
                    <div className="grid grid-cols-[100px_10px_1fr]"><span>No. Struk</span><span>:</span><span className="text-right font-semibold">{activeSelectedSale.receipt_number}</span></div>
                    <div className="grid grid-cols-[100px_10px_1fr]"><span>Tanggal</span><span>:</span><span className="text-right">{new Date(activeSelectedSale.created_at).toLocaleString('id-ID')}</span></div>
                    <div className="grid grid-cols-[100px_10px_1fr]"><span>Kasir</span><span>:</span><span className="text-right">{activeSelectedSale.cashier_name}</span></div>
                    {activeSelectedSale.customer_name && (
                      <div className="grid grid-cols-[100px_10px_1fr]"><span>Pelanggan</span><span>:</span><span className="text-right">{activeSelectedSale.customer_name}</span></div>
                    )}
                    <div className="grid grid-cols-[100px_10px_1fr]"><span>Tipe Pesanan</span><span>:</span><span className="text-right uppercase font-bold">{activeSelectedSale.order_type}</span></div>
                    {enableTableNumber && activeSelectedSale.table_number && (
                      <div className="grid grid-cols-[100px_10px_1fr]"><span>Meja</span><span>:</span><span className="text-right font-bold">{activeSelectedSale.table_number}</span></div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="border-t border-b border-dashed border-stone-300 dark:border-stone-700 py-2 space-y-1 text-[11px]">
                    {(activeSelectedSale.items || []).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span>{item.quantity}x {toCapitalCase(item.product_name)}</span>
                          <span className="font-semibold">Rp {item.total_price.toLocaleString('id-ID')}</span>
                        </div>
                        {item.notes && item.notes.trim() !== '' && (
                          <div className="text-[10px] text-stone-400 pl-3 font-sans italic">
                            * {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-1 text-[11px]">
                    <div className="grid grid-cols-[100px_10px_1fr]"><span>Subtotal</span><span>:</span><span className="text-right font-semibold">Rp {activeSelectedSale.subtotal.toLocaleString('id-ID')}</span></div>
                    {activeSelectedSale.discount_amount > 0 && (
                      <div className="grid grid-cols-[100px_10px_1fr] text-red-600"><span>Diskon</span><span>:</span><span className="text-right">-Rp {activeSelectedSale.discount_amount.toLocaleString('id-ID')}</span></div>
                    )}
                    {activeSelectedSale.tax_amount > 0 && (
                      <div className="grid grid-cols-[100px_10px_1fr]"><span>Pajak ({taxRate}%)</span><span>:</span><span className="text-right">Rp {activeSelectedSale.tax_amount.toLocaleString('id-ID')}</span></div>
                    )}
                    {activeSelectedSale.service_charge > 0 && (
                      <div className="grid grid-cols-[100px_10px_1fr]"><span>Layanan ({serviceRate}%)</span><span>:</span><span className="text-right">Rp {activeSelectedSale.service_charge.toLocaleString('id-ID')}</span></div>
                    )}
                    
                    <div className="grid grid-cols-[100px_10px_1fr] text-xs font-extrabold border-t border-stone-300 dark:border-stone-700 pt-1 text-stone-900 dark:text-stone-100">
                      <span>TAGIHAN</span><span>:</span><span className="text-right text-coffee-600 dark:text-coffee-400">Rp {activeSelectedSale.grand_total.toLocaleString('id-ID')}</span>
                    </div>

                    {activeSelectedSale.payments && activeSelectedSale.payments.length > 0 && (
                      <>
                        <div className="grid grid-cols-[100px_10px_1fr] text-[11px] pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
                          <span>BAYAR ({activeSelectedSale.payments[0].method.toUpperCase()})</span><span>:</span><span className="text-right font-semibold">Rp {activeSelectedSale.payments[0].amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="grid grid-cols-[100px_10px_1fr] text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span>KEMBALIAN</span><span>:</span><span className="text-right">Rp {(activeSelectedSale.payments[0].change_amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Receipt Footer */}
                  <div className="text-center pt-3 border-t border-dashed border-stone-300 dark:border-stone-700 text-stone-500 whitespace-pre-line text-[10px]">
                    {receiptFooter}
                  </div>
                </div>
              </div>

              {/* Bottom Action for Receipt Detail */}
              <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => handlePrint(activeSelectedSale)}
                  className="w-full py-2.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Ulang Struk
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
