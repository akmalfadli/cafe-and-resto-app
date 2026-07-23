import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Clock, ClipboardList, Check, X, ArrowLeft, Coffee, RefreshCw } from 'lucide-react';
import type { CustomerOrder } from '../../types';

export const CustomerOrdersQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    customerOrders,
    updateCustomerOrderStatus,
    products,
    addToCart,
    updateCartQty,
    updateCartNotes,
    clearCart,
    setCustomerName,
    setSelectedTable,
    setOrderType,
  } = useAppStore();

  // Background polling for customer orders
  useEffect(() => {
    const doFetch = () => useAppStore.getState().fetchCustomerOrders();
    doFetch();
    const interval = setInterval(doFetch, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingOrders = customerOrders.filter(o => o.status === 'pending');

  const handleApproveOrder = async (order: CustomerOrder) => {
    // 1. Populate cashier cart with the customer's QR order items
    clearCart();
    setCustomerName(order.customer_name);
    if (order.table_number) {
      setSelectedTable(order.table_number);
    }
    setOrderType(order.order_type);

    // Map items to cart
    for (const item of order.items || []) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        addToCart(prod);
        updateCartQty(prod.id, item.quantity);
        if (item.notes) {
          updateCartNotes(prod.id, item.notes);
        }
      }
    }

    // Save pending customer order ID for payment completion
    (window as any)._pendingCustomerOrderId = order.id;

    // Navigate back to POS with payment flag via router state (not URL params)
    navigate('/', { state: { openPayment: true } });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden select-none font-sans">
      
      {/* Header */}
      <header className="h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl border border-stone-200 dark:border-stone-700 transition"
            title="Kembali ke POS"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-coffee-500 text-white p-1.5 rounded-lg">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">
                Antrean Pesanan Pelanggan
              </h1>
              <p className="text-[10px] text-stone-400">
                Verifikasi, terima pembayaran, dan masukkan pesanan ke POS
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-coffee-50 dark:bg-coffee-950/40 text-coffee-600 dark:text-coffee-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-coffee-200 dark:border-coffee-900">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Auto-refresh aktif
          </div>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
            pendingOrders.length > 0
              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
          }`}>
            {pendingOrders.length} Pending
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {pendingOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-4">
            <div className="bg-stone-100 dark:bg-stone-900 p-6 rounded-3xl">
              <Clock className="w-16 h-16 text-stone-300 dark:text-stone-700 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-500 dark:text-stone-400">Tidak ada antrean pesanan pending</p>
              <p className="text-xs max-w-xs text-stone-400 dark:text-stone-500">
                Pesanan baru dari menu QR pelanggan akan otomatis muncul di sini secara real-time setiap 5 detik.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-5 py-2.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Coffee className="w-3.5 h-3.5" />
              Kembali ke POS Kasir
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingOrders.map((order: CustomerOrder) => (
              <div
                key={order.id}
                className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Order Top Meta */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-sm text-stone-800 dark:text-stone-100">
                      {order.customer_name}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">{order.order_number}</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="bg-coffee-50 text-coffee-600 dark:bg-coffee-950/40 dark:text-coffee-400 px-2 py-0.5 rounded-lg text-[9px] font-black">
                        MEJA: {order.table_number || '-'}
                      </span>
                      <span className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                        {order.order_type === 'dine_in' ? '🍽 Dine In' : '🛍 Take Away'}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[9px] font-black animate-pulse">
                    PENDING
                  </span>
                </div>

                {/* Items List */}
                <div className="border-t border-dashed border-stone-200 dark:border-stone-800 pt-3 space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div className="min-w-0 flex-1 pr-4">
                        <span className="font-bold text-stone-700 dark:text-stone-200">
                          {item.product_name}
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

                {/* Notes & Total */}
                {order.notes && (
                  <p className="text-[10px] text-stone-400 italic bg-stone-50 dark:bg-stone-850 px-3 py-1.5 rounded-lg">
                    📝 {order.notes}
                  </p>
                )}

                <div className="border-t border-stone-200 dark:border-stone-800 pt-3 flex justify-between items-center">
                  <div className="font-extrabold text-sm text-stone-800 dark:text-stone-100">
                    Total: <span className="text-coffee-600 dark:text-coffee-400 font-black">Rp {order.grand_total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (confirm('Tolak pesanan ini?')) {
                        await updateCustomerOrderStatus(order.id, 'rejected');
                      }
                    }}
                    className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApproveOrder(order)}
                    className="flex-[2] py-2.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl shadow-sm text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Verifikasi & Bayar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
