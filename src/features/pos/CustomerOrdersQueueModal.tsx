import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Clock, ClipboardList, Check, X } from 'lucide-react';
import type { CustomerOrder } from '../../types';

import { toCapitalCase } from '../../utils/formatters';

interface CustomerOrdersQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproveOrder: (order: CustomerOrder) => void;
}

export const CustomerOrdersQueueModal: React.FC<CustomerOrdersQueueModalProps> = ({
  isOpen,
  onClose,
  onApproveOrder
}) => {
  const { customerOrders, updateCustomerOrderStatus } = useAppStore();

  if (!isOpen) return null;

  const pendingOrders = customerOrders.filter(o => o.status === 'pending');

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden font-sans"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900/50">
          <div>
            <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-coffee-500" />
              Antrean Pesanan Pelanggan (QR Menu)
            </h3>
            <p className="text-[10px] text-stone-400">Verifikasi, terima pembayaran, dan masukkan pesanan ke POS</p>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xs font-bold"
          >
            Tutup
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <Clock className="w-10 h-10 text-stone-300 animate-pulse" />
              <p className="text-xs font-bold">Tidak ada antrean pesanan pending</p>
              <p className="text-[10px] max-w-[240px]">Pesanan baru dari menu QR pelanggan akan otomatis muncul di sini secara real-time.</p>
            </div>
          ) : (
            pendingOrders.map((order: CustomerOrder) => (
              <div 
                key={order.id} 
                className="bg-stone-50 dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-3"
              >
                {/* Order Top Meta */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs text-stone-800 dark:text-stone-100">
                      {order.customer_name} <span className="text-[10px] text-stone-400 font-mono">({order.order_number})</span>
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-coffee-50 text-coffee-600 dark:bg-coffee-950/40 dark:text-coffee-400 px-2 py-0.5 rounded-lg text-[9px] font-black">
                        MEJA: {order.table_number || '-'}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Reject Button */}
                    <button
                      onClick={async () => {
                        if (confirm('Tolak pesanan ini?')) {
                          await updateCustomerOrderStatus(order.id, 'rejected');
                        }
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="Tolak Pesanan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {/* Approve / Import to POS Cart Button */}
                    <button
                      onClick={() => onApproveOrder(order)}
                      className="bg-coffee-500 hover:bg-coffee-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition"
                    >
                      <Check className="w-3 h-3" /> Verifikasi & Bayar
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-dashed border-stone-200 dark:border-stone-800 pt-2.5 space-y-1.5">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-[11px]">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="font-bold text-stone-700 dark:text-stone-200">
                          {toCapitalCase(item.product_name)}
                        </span>
                        <span className="text-stone-400 font-bold ml-1.5">x{item.quantity}</span>
                        {item.notes && (
                          <p className="text-[9px] text-amber-600 dark:text-amber-500 italic mt-0.5">
                            * Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-stone-600 dark:text-stone-300 font-bold shrink-0">
                        Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer Global Notes & Total */}
                <div className="flex justify-between items-center pt-2 border-t border-stone-150 dark:border-stone-800/60 text-xs">
                  <span className="text-[10px] text-stone-400 truncate max-w-[60%]">
                    {order.notes ? `Memo: ${order.notes}` : ''}
                  </span>
                  <div className="font-extrabold text-stone-800 dark:text-stone-100">
                    Total: <span className="text-coffee-600 dark:text-coffee-400 font-black">Rp {order.grand_total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
