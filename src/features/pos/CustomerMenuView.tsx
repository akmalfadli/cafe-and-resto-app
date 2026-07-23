import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Coffee, CupSoda, Cookie, Utensils, IceCream, Grid, Search, 
  ArrowLeft, ShoppingCart, Check, Clock, CheckCircle
} from 'lucide-react';
import type { Product } from '../../types';

interface CustomerMenuViewProps {
  onBack: () => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({ onBack }) => {
  const { products, categories, ingredients, recipes, tables, submitCustomerOrder } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Customer Form details
  const [custName, setCustName] = useState('');
  const [custTable, setCustTable] = useState('T-01');
  const [custNotes, setCustNotes] = useState('');

  // Submit Order Workflow State
  const [submittedOrderNo, setSubmittedOrderNo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Coffee': return <Coffee className="w-4 h-4 md:w-5 md:h-5" />;
      case 'CupSoda': return <CupSoda className="w-4 h-4 md:w-5 md:h-5" />;
      case 'Cookie': return <Cookie className="w-4 h-4 md:w-5 md:h-5" />;
      case 'Utensils': return <Utensils className="w-4 h-4 md:w-5 md:h-5" />;
      case 'IceCream': return <IceCream className="w-4 h-4 md:w-5 md:h-5" />;
      default: return <Grid className="w-4 h-4 md:w-5 md:h-5" />;
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.is_available;
  });

  const addToCustomerCart = (product: Product) => {
    const matchedRecipe = recipes.find(r => r.product_id === product.id);
    const isOutOfStock = matchedRecipe && matchedRecipe.items && matchedRecipe.items.length > 0 && matchedRecipe.items.some((rItem) => {
      const matchedIng = ingredients.find(ing => ing.id === rItem.ingredient_id);
      return matchedIng && matchedIng.current_stock <= 0;
    });

    if (isOutOfStock) return;

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1, notes: '' }]);
    }
  };

  const updateQuantity = (productId: string, amount: number) => {
    const existingIndex = cart.findIndex((item) => item.product.id === productId);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + amount;
      if (newQty <= 0) {
        setCart(cart.filter(item => item.product.id !== productId));
      } else {
        updated[existingIndex].quantity = newQty;
        setCart(updated);
      }
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!custName.trim()) {
      alert('Silakan masukkan nama Anda terlebih dahulu.');
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const prefix = 'CUST';
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}-${rand}`;

      const payload = {
        order_number: orderNumber,
        customer_name: custName.trim(),
        table_number: custTable,
        order_type: 'dine_in',
        subtotal: totalAmount,
        tax_amount: 0,
        service_charge: 0,
        grand_total: totalAmount,
        status: 'pending',
        notes: custNotes,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          notes: item.notes,
          total_price: item.product.selling_price * item.quantity
        }))
      };

      await submitCustomerOrder(payload);
      setSubmittedOrderNo(orderNumber);
      setCart([]);
      setShowOrderSummary(false);
    } catch (e: any) {
      alert('Gagal mengirim pesanan: ' + e?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation Screen
  if (submittedOrderNo) {
    return (
      <div className="h-screen w-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-3xl shadow-xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-stone-850 dark:text-stone-100">Pesanan Berhasil Dibuat!</h2>
            <p className="text-xs text-stone-400 font-mono">No. Pesanan: <span className="font-bold text-coffee-600">{submittedOrderNo}</span></p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl text-stone-700 dark:text-stone-300 text-xs font-bold space-y-2 leading-relaxed">
            <Clock className="w-5 h-5 text-amber-500 mx-auto animate-bounce" />
            <p>Silakan menuju ke Kasir untuk melakukan pembayaran.</p>
            <p className="text-[10px] text-stone-400 font-medium">Beri tahu kasir nama Anda (<span className="font-bold">{custName}</span>) atau tunjukkan nomor pesanan di atas.</p>
          </div>

          <button
            onClick={() => {
              setSubmittedOrderNo(null);
              setCustName('');
              setCustNotes('');
            }}
            className="w-full bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
          >
            Buat Pesanan Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-50 dark:bg-stone-950 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="h-16 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-xl transition text-stone-600 dark:text-stone-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-tight">Daftar Menu Pelanggan</h1>
            <p className="text-[10px] text-stone-400">Silakan pilih menu makanan dan minuman favorit Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="relative p-2.5 bg-coffee-50 dark:bg-coffee-950/40 text-coffee-600 dark:text-coffee-400 rounded-xl hover:bg-coffee-100 dark:hover:bg-coffee-950/70 transition flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-coffee-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border-2 border-white dark:border-stone-900 animate-bounce">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* FILTER & SEARCH */}
      <div className="bg-white dark:bg-stone-900 p-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari makanan, kopi, soda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800 text-stone-850 dark:text-stone-100 border border-stone-200 dark:border-stone-750 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-coffee-500 text-white shadow-sm'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Semua</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-coffee-500 text-white shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BODY MENU & PRODUCT GRID */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 p-3 md:p-6 overflow-y-auto bg-stone-100/50 dark:bg-stone-950/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 pb-20">
            {filteredProducts.map((product) => {
              const matchedRecipe = recipes.find(r => r.product_id === product.id);
              const isOutOfStock = matchedRecipe && matchedRecipe.items && matchedRecipe.items.length > 0 && matchedRecipe.items.some((rItem) => {
                const matchedIng = ingredients.find(ing => ing.id === rItem.ingredient_id);
                return matchedIng && matchedIng.current_stock <= 0;
              });

              const cartItem = cart.find((item) => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCustomerCart(product)}
                  className={`bg-white dark:bg-stone-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col relative group select-none ${
                    isOutOfStock 
                      ? 'opacity-60 border-stone-200 dark:border-stone-800' 
                      : cartItem 
                        ? 'border-coffee-500 ring-2 ring-coffee-500/20' 
                        : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="h-28 md:h-36 w-full overflow-hidden bg-stone-100 dark:bg-stone-850 relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    
                    {product.is_favorite && (
                      <span className="absolute top-2 left-2 bg-coffee-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow">
                        FAVORIT
                      </span>
                    )}

                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-md tracking-wider">
                          HABIS / SOLD OUT
                        </span>
                      </div>
                    ) : cartItem ? (
                      <div className="absolute top-2 right-2 bg-coffee-500 text-white p-1 rounded-full shadow flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 font-bold" />
                      </div>
                    ) : null}
                  </div>

                  <div className="p-2.5 md:p-3 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <h4 className="font-extrabold text-xs md:text-sm text-stone-800 dark:text-stone-100 line-clamp-2">
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs md:text-sm text-coffee-600 dark:text-coffee-400">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>

                      {!isOutOfStock && cartItem && (
                        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, -1);
                            }}
                            className="w-5 h-5 rounded bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-250 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-black text-stone-800 dark:text-stone-100">{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(product.id, 1);
                            }}
                            className="w-5 h-5 rounded bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-250 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ORDER SUMMARY SIDE BAR */}
        {showOrderSummary && (
          <aside className="absolute md:static right-0 top-0 bottom-0 z-20 w-80 md:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 shrink-0">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900/60">
              <div>
                <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-coffee-500" />
                  Pesanan Saya
                </h3>
                <p className="text-[10px] text-stone-400">Silakan isi detail Anda di bawah ini</p>
              </div>
              <button 
                onClick={() => setShowOrderSummary(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            {/* Customer Information Inputs */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Nama Anda *</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">No. Meja</label>
                  <select
                    value={custTable}
                    onChange={(e) => setCustTable(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.table_number}>Meja {t.table_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sendok 2..."
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 text-stone-850 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* List Order Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-2 p-6">
                  <ShoppingCart className="w-10 h-10 text-stone-300" />
                  <p className="text-xs font-bold">Keranjang Anda masih kosong</p>
                  <p className="text-[10px] max-w-[200px]">Silakan klik menu-menu lezat di sebelah kiri untuk ditambahkan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-stone-50 dark:bg-stone-850 p-2.5 rounded-2xl border border-stone-150 dark:border-stone-800 text-xs">
                    <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-stone-800 dark:text-stone-100 truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-coffee-600 font-bold mt-0.5">Rp {item.product.selling_price.toLocaleString('id-ID')}</p>
                      
                      <input 
                        type="text" 
                        placeholder="Catatan memasak (pedas, manis)..."
                        value={item.notes}
                        onChange={(e) => {
                          const updated = [...cart];
                          const idx = updated.findIndex(i => i.product.id === item.product.id);
                          if (idx > -1) {
                            updated[idx].notes = e.target.value;
                            setCart(updated);
                          }
                        }}
                        className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] rounded-lg px-2 py-1 mt-1.5 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -item.quantity)} 
                        className="text-stone-300 hover:text-red-500 font-bold"
                      >
                        ×
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-4 h-4 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 font-bold flex items-center justify-center text-[10px]">-</button>
                        <span className="text-[10px] font-black text-stone-800 dark:text-stone-100 px-1">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-4 h-4 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 font-bold flex items-center justify-center text-[10px]">+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Footer Summary */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-500">Estimasi Total Bill:</span>
                <span className="font-black text-sm text-stone-850 dark:text-stone-100">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Pesan & Dapatkan Kode Bayar'}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Bottom Bar (Mobile view only) */}
      {cart.length > 0 && !showOrderSummary && (
        <div className="fixed bottom-4 left-4 right-4 z-10 md:hidden bg-coffee-600 text-white p-3 rounded-2xl shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
          <div>
            <span className="text-[10px] text-coffee-100 font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} item terpilih</span>
            <p className="text-xs font-black">Rp {totalAmount.toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={() => setShowOrderSummary(true)}
            className="bg-white text-coffee-700 font-black px-4 py-1.5 rounded-xl text-xs shadow"
          >
            Lihat Pesanan
          </button>
        </div>
      )}
    </div>
  );
};

