import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Printer, CheckCircle, X, DollarSign, 
  CreditCard, QrCode 
} from 'lucide-react';
import type { Sale } from '../../types';
import { printerService } from '../../services/printerService';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose }) => {
  const { cart, products, categories, discountType, discountValue, taxRate, serviceRate, completeSale, receiptHeader, receiptFooter, receiptLogo, enableTableNumber, enableTax } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = enableTax ? Math.round((afterDiscount * taxRate) / 100) : 0;
  const serviceCharge = Math.round((afterDiscount * serviceRate) / 100);
  const grandTotal = Math.round(afterDiscount + taxAmount + serviceCharge);

  const parsedCash = parseFloat(cashTendered) || 0;
  const change = Math.max(0, parsedCash - grandTotal);
  const isCashExact = parsedCash >= grandTotal;

  const handleProcessPayment = async () => {
    const amount = paymentMethod === 'cash' ? parsedCash : grandTotal;
    const sale = await completeSale(paymentMethod, amount, paymentMethod === 'qris' ? 'QRIS-' + Date.now().toString().slice(-6) : undefined);
    setCompletedSale(sale);
  };

  const handlePrintReceipt = async () => {
    if (completedSale) {
      await printerService.printViaBluetooth(completedSale, receiptHeader, receiptFooter, enableTableNumber, receiptLogo);
    } else {
      window.print();
    }
  };

  const handleFinish = () => {
    setCompletedSale(null);
    setCashTendered('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        
        <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">
              {completedSale ? 'Struk Pembayaran' : 'Pembayaran Kasir'}
            </h2>
            <p className="text-xs text-coffee-100">
              {completedSale ? 'Transaksi Berhasil Disimpan' : 'Pilih Metode Pembayaran'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-coffee-600 rounded-full">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {!completedSale ? (
          <div className="p-6 space-y-6">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>Diskon</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {enableTax && (
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Pajak ({taxRate}%)</span>
                  <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-500">
                <span>Layanan ({serviceRate}%)</span>
                <span>Rp {serviceCharge.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-stone-800 pt-2 border-t border-stone-200">
                <span>Total Tagihan</span>
                <span className="text-coffee-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Tunai', icon: DollarSign },
                  { id: 'qris', label: 'QRIS', icon: QrCode },
                  { id: 'transfer', label: 'Transfer', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold ${
                        active
                          ? 'border-coffee-500 bg-coffee-50 text-coffee-600 shadow-sm'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-700 block">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={`Min: Rp ${grandTotal.toLocaleString('id-ID')}`}
                  className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base font-extrabold text-stone-800 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />

                <div className="flex gap-2">
                  {[grandTotal, Math.ceil(grandTotal / 50000) * 50000, 100000].map((quickAmt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashTendered(quickAmt.toString())}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-[11px] font-semibold text-stone-700 border border-stone-200"
                    >
                      Rp {quickAmt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                {parsedCash > 0 && (
                  <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-bold text-xs">
                    <span>Kembalian:</span>
                    <span className="text-sm font-extrabold">Rp {change.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                disabled={paymentMethod === 'cash' && !isCashExact}
                onClick={handleProcessPayment}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-md transition ${
                  paymentMethod === 'cash' && !isCashExact
                    ? 'bg-stone-300 cursor-not-allowed'
                    : 'bg-coffee-500 hover:bg-coffee-600'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 font-mono text-xs text-stone-800 space-y-3 print-section">
              <div className="text-center border-b border-dashed border-stone-300 pb-3 whitespace-pre-line font-bold text-stone-800">
                {receiptLogo && (
                  <img src={receiptLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
                )}
                {receiptHeader}
              </div>

              {/* Transaction Meta (Aligned Colons) */}
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-[110px_10px_1fr]"><span>No. Struk</span><span>:</span><span className="text-right font-semibold">{completedSale.receipt_number}</span></div>
                <div className="grid grid-cols-[110px_10px_1fr]"><span>Tanggal</span><span>:</span><span className="text-right">{new Date(completedSale.created_at).toLocaleString()}</span></div>
                <div className="grid grid-cols-[110px_10px_1fr]"><span>Kasir</span><span>:</span><span className="text-right">{completedSale.cashier_name}</span></div>
                <div className="grid grid-cols-[110px_10px_1fr]"><span>Tipe Pesanan</span><span>:</span><span className="text-right uppercase font-bold">{completedSale.order_type}</span></div>
                {enableTableNumber && completedSale.table_number && (
                  <div className="grid grid-cols-[110px_10px_1fr]"><span>Meja</span><span>:</span><span className="text-right font-bold">{completedSale.table_number}</span></div>
                )}
              </div>

              {/* Items List (Sorted by Category Order) */}
              <div className="border-t border-b border-dashed border-stone-300 py-2 space-y-1 text-xs">
                {(() => {
                  const sortedItems = [...completedSale.items].sort((a, b) => {
                    const prodA = products.find((p) => p.id === a.product_id);
                    const prodB = products.find((p) => p.id === b.product_id);
                    const catA = categories.find((c) => c.id === prodA?.category_id);
                    const catB = categories.find((c) => c.id === prodB?.category_id);
                    const orderA = catA?.sort_order ?? 999;
                    const orderB = catB?.sort_order ?? 999;
                    return orderA - orderB;
                  });

                  return sortedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span className="font-semibold">Rp {item.total_price.toLocaleString('id-ID')}</span>
                    </div>
                  ));
                })()}
              </div>

              {/* Financial Summary (Aligned Colons & Right-Aligned Amounts) */}
              <div className="space-y-1 text-xs pt-1">
                <div className="grid grid-cols-[110px_10px_1fr]"><span>Subtotal</span><span>:</span><span className="text-right font-semibold">Rp {completedSale.subtotal.toLocaleString('id-ID')}</span></div>
                {completedSale.discount_amount > 0 && (
                  <div className="grid grid-cols-[110px_10px_1fr] text-red-600"><span>Diskon</span><span>:</span><span className="text-right">-Rp {completedSale.discount_amount.toLocaleString('id-ID')}</span></div>
                )}
                {completedSale.tax_amount > 0 && (
                  <div className="grid grid-cols-[110px_10px_1fr]"><span>Pajak ({taxRate}%)</span><span>:</span><span className="text-right">Rp {completedSale.tax_amount.toLocaleString('id-ID')}</span></div>
                )}
                {completedSale.service_charge > 0 && (
                  <div className="grid grid-cols-[110px_10px_1fr]"><span>Layanan ({serviceRate}%)</span><span>:</span><span className="text-right">Rp {completedSale.service_charge.toLocaleString('id-ID')}</span></div>
                )}
                
                <div className="grid grid-cols-[110px_10px_1fr] text-sm font-extrabold border-t border-stone-300 pt-1 text-stone-900">
                  <span>TAGIHAN</span><span>:</span><span className="text-right text-coffee-600">Rp {completedSale.grand_total.toLocaleString('id-ID')}</span>
                </div>
                
                {completedSale.payments && completedSale.payments.length > 0 && (
                  <>
                    <div className="grid grid-cols-[110px_10px_1fr] text-xs pt-1 border-t border-dashed border-stone-200">
                      <span>BAYAR ({completedSale.payments[0].method.toUpperCase()})</span><span>:</span><span className="text-right font-semibold">Rp {completedSale.payments[0].amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="grid grid-cols-[110px_10px_1fr] text-xs font-bold text-emerald-600">
                      <span>KEMBALIAN</span><span>:</span><span className="text-right">Rp {(completedSale.payments[0].change_amount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-stone-300 text-stone-500 whitespace-pre-line font-medium text-center">
                {receiptFooter}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 border border-coffee-500 text-coffee-600 rounded-xl font-bold hover:bg-coffee-50 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Cetak Struk
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
              >
                Selesai
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
