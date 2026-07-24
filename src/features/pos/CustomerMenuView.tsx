import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Coffee, CupSoda, Cookie, Utensils, IceCream, Grid, Search,
  ShoppingCart, Check, Clock, CheckCircle, Info, X, MapPin, AlertCircle, User
} from 'lucide-react';
import type { Product } from '../../types';
import { toCapitalCase } from '../../utils/formatters';
import { calculateDistanceMeters } from '../auth/AttendanceModal';

interface CustomerMenuViewProps {
  // no-op (back button removed)
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = () => {
  const {
    products, categories, ingredients, recipes, tables, enableTableNumber, submitCustomerOrder, outletName, receiptLogo,
    outletLat, outletLng, maxAttendanceRadius, enableGpsValidation
  } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ product: Product; quantity: number; notes: string }[]>([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [selectedProductForIngredients, setSelectedProductForIngredients] = useState<Product | null>(null);

  // Customer Form details & Validation state
  const [custName, setCustName] = useState('');
  const [custTable, setCustTable] = useState('T-01');
  const [custNotes, setCustNotes] = useState('');
  const [showNameErrorModal, setShowNameErrorModal] = useState(false);
  const [showGpsErrorModal, setShowGpsErrorModal] = useState<string | null>(null);

  // Submit Order Workflow State
  const [submittedOrderNo, setSubmittedOrderNo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Location State for Outlet Geofencing
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gettingGps, setGettingGps] = useState(false);

  // Request GPS Location when menu page mounts or when GPS validation is enabled
  const fetchCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS Geolocation.');
      return;
    }
    setGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCurrentCoords({ lat: userLat, lng: userLng });

        if (outletLat && outletLng) {
          const dist = calculateDistanceMeters(userLat, userLng, outletLat, outletLng);
          setDistanceMeters(dist);
        }
        setGettingGps(false);
      },
      (err) => {
        setGpsError('Gagal mengakses lokasi GPS: ' + err.message + '. Harap izinkan akses lokasi.');
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  React.useEffect(() => {
    if (enableGpsValidation) {
      fetchCurrentGps();
    }
  }, [enableGpsValidation, outletLat, outletLng]);

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

  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      return matchesCategory && matchesSearch && product.is_available;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalAmount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  }, [cart]);

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



  const handleSubmitOrder = async () => {
    if (!custName.trim()) {
      setShowNameErrorModal(true);
      setShowOrderSummary(true); // Open order summary sidebar if closed so user can type name
      return;
    }
    if (cart.length === 0) return;

    // Validate GPS Location if Geofencing is enabled in Settings
    if (enableGpsValidation) {
      if (gpsError || !currentCoords) {
        setShowGpsErrorModal(
          'Gagal mengakses koordinat lokasi GPS peranti Anda! Harap izinkan akses lokasi (Location Permission) pada browser untuk dapat melakukan pemesanan.'
        );
        fetchCurrentGps();
        return;
      }

      if (outletLat && outletLng && currentCoords) {
        const computedDist = calculateDistanceMeters(
          currentCoords.lat,
          currentCoords.lng,
          outletLat,
          outletLng
        );
        setDistanceMeters(computedDist);

        if (computedDist > maxAttendanceRadius) {
          setShowGpsErrorModal(
            `Pemesanan Ditolak! Posisi Anda terdeteksi berjarak ${computedDist} meter dari outlet. Maksimal jarak pemesanan yang diizinkan adalah ${maxAttendanceRadius} meter.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const prefix = 'CUST';
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}-${rand}`;

      const payload = {
        order_number: orderNumber,
        customer_name: custName.trim(),
        table_number: enableTableNumber ? custTable : undefined,
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
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Pesanan Berhasil Dibuat!</h2>
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
          {receiptLogo ? (
            <img
              src={receiptLogo}
              alt={outletName || 'Logo'}
              className="h-10 w-10 object-contain rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 p-1 shrink-0"
            />
          ) : (
            <div className="p-2 bg-coffee-500 text-white rounded-xl flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-base font-extrabold text-stone-800 dark:text-stone-100 leading-tight">
              {outletName || 'Daftar Menu Pelanggan'}
            </h1>
            <p className="text-[10px] text-stone-400 dark:text-stone-400 font-medium">Silakan pilih menu makanan dan minuman favorit Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="relative p-2.5 bg-coffee-50 dark:bg-coffee-950/60 text-coffee-600 dark:text-coffee-300 rounded-xl hover:bg-coffee-100 dark:hover:bg-coffee-900/80 transition flex items-center justify-center border border-transparent dark:border-coffee-800/40"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-coffee-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border-2 border-white dark:border-stone-900">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT: Left Sidebar + Product Grid */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT COLUMN: Category Sidebar (like POS Screen) */}
        <aside className="w-20 sm:w-24 md:w-28 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-1.5 md:p-2 flex flex-col gap-1.5 md:gap-2 shrink-0 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex flex-col items-center justify-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition ${selectedCategory === 'all'
                ? 'bg-coffee-500 text-white font-bold shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
          >
            <Grid className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            <span className="text-[10px] md:text-[11px] font-medium text-center leading-tight">Semua</span>
          </button>

          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition ${active
                    ? 'bg-coffee-500 text-white font-bold shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
              >
                <div className="mb-1 transform scale-90 md:scale-100">{getCategoryIcon(cat.icon)}</div>
                <span className="text-[10px] md:text-[11px] text-center leading-tight font-medium">{cat.name}</span>
              </button>
            );
          })}
        </aside>

        {/* CENTER COLUMN: Search + Product Grid */}
        <main className="flex-1 overflow-y-auto bg-stone-100/50 dark:bg-stone-950/20 flex flex-col min-h-full">
          {/* GPS Geofencing Status Banner (If Validation Active) */}
          {enableGpsValidation && (
            <div className="px-3 pt-3 md:px-6 md:pt-4 shrink-0">
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between shadow-xs ${
                gpsError
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : distanceMeters !== null && distanceMeters <= maxAttendanceRadius
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    {gettingGps ? (
                      <span>Memeriksa posisi GPS Anda...</span>
                    ) : gpsError ? (
                      <span>{gpsError}</span>
                    ) : distanceMeters !== null ? (
                      <span>
                        Jarak Anda ke Outlet: <strong>{distanceMeters}m</strong> (Batas: {maxAttendanceRadius}m)
                        {distanceMeters <= maxAttendanceRadius ? ' — Area Terverifikasi ✅' : ' — Di Luar Jangkauan ❌'}
                      </span>
                    ) : (
                      <span>Memverifikasi posisi GPS outlet...</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchCurrentGps}
                  className="text-[10px] font-bold underline hover:opacity-80 shrink-0 ml-2"
                >
                  Refresh GPS
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="p-3 md:px-6 md:pt-3 md:pb-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari makanan, kopi, soda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-750 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-coffee-500 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 p-3 md:px-6 md:pb-6 pt-0">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400 dark:text-stone-400 space-y-2">
                <p className="text-xs font-bold text-stone-600 dark:text-stone-300">Tidak ada produk ditemukan</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-400">Coba cari dengan kata kunci lain atau pilih kategori lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-8">
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
                      className={`bg-white dark:bg-stone-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col relative group select-none ${isOutOfStock
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
                          className="w-full h-full object-cover transition duration-300"
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

                        {/* Info Button for Ingredients */}
                        {matchedRecipe && matchedRecipe.items && matchedRecipe.items.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductForIngredients(product);
                            }}
                            title="Lihat Komposisi Bahan"
                            className="absolute bottom-2 right-2 z-10 p-1.5 bg-white/90 dark:bg-stone-800/90 hover:bg-coffee-500 hover:text-white text-stone-600 dark:text-stone-300 rounded-full shadow-md backdrop-blur-xs transition transform hover:scale-110 flex items-center justify-center"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="p-2.5 md:p-3 flex flex-col justify-between flex-1 space-y-2">
                        <div>
                          <h4 className="font-extrabold text-xs md:text-sm text-stone-800 dark:text-stone-100 line-clamp-2">
                            {toCapitalCase(product.name)}
                          </h4>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs md:text-sm text-coffee-600 dark:text-coffee-400">
                            Rp {product.selling_price.toLocaleString('id-ID')}
                          </span>

                          {!isOutOfStock && cartItem && (
                            <div
                              className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded-lg shrink-0 relative z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-6 h-6 rounded bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-250 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white transition"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-black text-stone-800 dark:text-stone-100 min-w-[16px] text-center">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-6 rounded bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-250 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white transition"
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
            )}
          </div>

          {/* Credits Footer */}
          <footer className="mt-8 pt-4 pb-2 border-t border-stone-200/60 dark:border-stone-800/60 text-center space-y-1">
            {outletName && (
              <p className="text-xs font-bold text-stone-700 dark:text-stone-300 tracking-wide uppercase">
                {outletName}
              </p>
            )}
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
              CafePOS created by{' '}
              <a
                href="https://akmalfadli.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-coffee-600 dark:text-coffee-400 hover:underline transition"
              >
                Akmal Fadli
              </a>
            </p>
          </footer>
        </main>

        {/* ORDER SUMMARY SIDE BAR */}
        {showOrderSummary && (
          <aside className="absolute md:static right-0 top-0 bottom-0 z-20 w-80 md:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 shrink-0">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900/60">
              <div>
                <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-coffee-500" />
                  Pesanan Saya
                  {cart.length > 0 && (
                    <span className="text-[10px] bg-coffee-500 text-white font-extrabold px-2 py-0.5 rounded-full ml-1">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-stone-400 dark:text-stone-400">Silakan isi detail Anda di bawah ini</p>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 font-bold hover:underline transition"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="text-stone-400 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold transition p-1"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Customer Information Inputs */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-1">Nama Anda *</label>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>

              <div className={enableTableNumber ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                {enableTableNumber && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-1">No. Meja</label>
                    <select
                      value={custTable}
                      onChange={(e) => setCustTable(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none"
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.table_number}>Meja {t.table_number}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sendok 2..."
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>
              </div>
            </div>

            {/* List Order Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 dark:text-stone-400 space-y-2 p-6">
                  <ShoppingCart className="w-10 h-10 text-stone-300 dark:text-stone-600" />
                  <p className="text-xs font-bold text-stone-600 dark:text-stone-300">Keranjang Anda masih kosong</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-400 max-w-[200px]">Silakan klik menu-menu lezat di sebelah kiri untuk ditambahkan.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-stone-50 dark:bg-stone-800 p-3 rounded-2xl border border-stone-150 dark:border-stone-750 text-xs shadow-2xs hover:border-coffee-300 dark:hover:border-coffee-700 transition">
                    <img src={item.product.image_url} alt={item.product.name} className="w-13 h-13 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 truncate pr-1">{toCapitalCase(item.product.name)}</h4>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100 shrink-0 text-xs">
                          Rp {(item.product.selling_price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[10px] text-coffee-600 dark:text-coffee-400 font-bold mt-0.5">
                        @Rp {item.product.selling_price.toLocaleString('id-ID')}
                      </p>

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
                        className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] rounded-lg px-2 py-1 mt-1.5 focus:outline-none text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0 pl-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, -item.quantity)}
                        title="Hapus Item"
                        className="text-stone-300 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 font-bold text-base transition leading-none"
                      >
                        ×
                      </button>
                      <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 bg-stone-100 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-200 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white transition"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-black text-stone-800 dark:text-stone-100 min-w-[18px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 bg-stone-100 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-250 font-bold flex items-center justify-center text-xs hover:bg-coffee-500 hover:text-white transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Footer Summary */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-500 dark:text-stone-400">Estimasi Total Bill:</span>
                <span className="font-black text-sm text-stone-900 dark:text-stone-100">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-coffee-500 hover:bg-coffee-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Pesan & Bayar'}
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
      {/* Ingredients Detail Modal Dialog */}
      {selectedProductForIngredients && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedProductForIngredients(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Product Image */}
            <div className="relative h-48 w-full bg-stone-100 dark:bg-stone-800">
              <img
                src={selectedProductForIngredients.image_url}
                alt={selectedProductForIngredients.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductForIngredients(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:bg-black/80 rounded-full backdrop-blur-xs transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 text-white">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-coffee-300">Detail Komposisi</span>
                <h3 className="text-base font-extrabold leading-tight">
                  {toCapitalCase(selectedProductForIngredients.name)}
                </h3>
              </div>
            </div>

            {/* Ingredients Content Body */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-100 dark:border-stone-800">
                <span className="text-stone-500 font-medium">Harga Menu:</span>
                <span className="font-extrabold text-coffee-600 dark:text-coffee-400 text-sm">
                  Rp {selectedProductForIngredients.selling_price.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-coffee-500" />
                  Bahan-bahan:
                </h4>

                {(() => {
                  const matchedRecipe = recipes.find(r => r.product_id === selectedProductForIngredients.id);
                  if (!matchedRecipe || !matchedRecipe.items || matchedRecipe.items.length === 0) {
                    return (
                      <p className="text-xs text-stone-400 italic py-2">
                        Belum ada rincian bahan resep untuk menu ini.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {matchedRecipe.items.map((rItem, idx) => {
                        const ing = ingredients.find(i => i.id === rItem.ingredient_id);
                        if (!ing) return null;
                        return (
                          <div
                            key={idx}
                            className="flex items-center p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-150 dark:border-stone-750 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-coffee-100 dark:bg-coffee-950/40 text-coffee-700 dark:text-coffee-300 font-extrabold flex items-center justify-center text-[11px] shrink-0">
                                {ing.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-stone-800 dark:text-stone-100">
                                {toCapitalCase(ing.name)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Action Add to Cart from Modal */}
              <button
                type="button"
                onClick={() => {
                  addToCustomerCart(selectedProductForIngredients);
                  setSelectedProductForIngredients(null);
                }}
                className="w-full py-3 bg-coffee-500 hover:bg-coffee-600 text-white font-extrabold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 mt-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Tambah ke Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Customer Name Required Alert Dialog Modal */}
      {showNameErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans"
          onClick={() => setShowNameErrorModal(false)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-stone-850 dark:text-stone-100">
                Nama Pemesan Belum Diisi!
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Silakan masukkan <strong>Nama Anda</strong> pada kolom pemesanan agar kasir dapat memanggil dan memproses pesanan Anda dengan benar.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowNameErrorModal(false);
                  // Focus the name input element if available
                  setTimeout(() => {
                    const input = document.querySelector('input[placeholder*="nama Anda"]') as HTMLInputElement;
                    if (input) input.focus();
                  }, 100);
                }}
                className="w-full py-3 bg-coffee-500 hover:bg-coffee-600 text-white font-extrabold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Mengerti, Isi Nama Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* GPS Location / Out of Range Alert Dialog Modal */}
      {showGpsErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans"
          onClick={() => setShowGpsErrorModal(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <MapPin className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-base text-stone-850 dark:text-stone-100">
                Di Luar Area Jangkauan!
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {showGpsErrorModal}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowGpsErrorModal(null);
                  fetchCurrentGps();
                }}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-extrabold rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Refresh Lokasi GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

