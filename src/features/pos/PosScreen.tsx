import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { 
  Coffee, CupSoda, Cookie, Utensils, IceCream, Grid, Search, 
  Trash2, Plus, Minus, CreditCard, User, 
  UtensilsCrossed, ShoppingBag, Truck, Tag, LogOut, DoorOpen,
  LayoutGrid, List, Shield, AlertTriangle, ClipboardList, History, MoreVertical
} from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { ShiftGateScreen } from './ShiftGateScreen';
import { CloseShiftModal } from './CloseShiftModal';
import { TransactionHistoryModal } from './TransactionHistoryModal';

interface PosScreenProps {
  onSwitchToBackOffice?: () => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ onSwitchToBackOffice }) => {
  // Fine-grained Zustand selectors to prevent completeSale/background sync from re-rendering PosScreen and closing dialogs
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const activeShift = useAppStore(s => s.activeShift);
  const categories = useAppStore(s => s.categories);
  const products = useAppStore(s => s.products);
  const ingredients = useAppStore(s => s.ingredients);
  const recipes = useAppStore(s => s.recipes);
  const cart = useAppStore(s => s.cart);
  const selectedCategory = useAppStore(s => s.selectedCategory);
  const searchQuery = useAppStore(s => s.searchQuery);
  const orderType = useAppStore(s => s.orderType);
  const selectedTable = useAppStore(s => s.selectedTable);
  const customerName = useAppStore(s => s.customerName);
  const enableTableNumber = useAppStore(s => s.enableTableNumber);
  const enableTax = useAppStore(s => s.enableTax);
  const discountType = useAppStore(s => s.discountType);
  const discountValue = useAppStore(s => s.discountValue);
  const taxRate = useAppStore(s => s.taxRate);
  const serviceRate = useAppStore(s => s.serviceRate);
  const tables = useAppStore(s => s.tables);
  const setSelectedCategory = useAppStore(s => s.setSelectedCategory);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const setOrderType = useAppStore(s => s.setOrderType);
  const setSelectedTable = useAppStore(s => s.setSelectedTable);
  const setCustomerName = useAppStore(s => s.setCustomerName);
  const addToCart = useAppStore(s => s.addToCart);
  const updateCartQty = useAppStore(s => s.updateCartQty);
  const updateCartNotes = useAppStore(s => s.updateCartNotes);
  const removeFromCart = useAppStore(s => s.removeFromCart);
  const clearCart = useAppStore(s => s.clearCart);
  const setDiscount = useAppStore(s => s.setDiscount);
  const pendingSales = useAppStore(s => s.pendingSales);
  const isDatabaseMode = useAppStore(s => s.isDatabaseMode);
  const syncOfflineSales = useAppStore(s => s.syncOfflineSales);

  const navigate = useNavigate();
  const location = useLocation();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [tempDiscount, setTempDiscount] = useState<string>('0');
  const [modalDiscType, setModalDiscType] = useState<'fixed' | 'percentage'>('fixed');
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('cafepos_menu_view_mode') as 'card' | 'list') || 'card';
  });

  // Periodically fetch customer orders in background (for badge count)
  React.useEffect(() => {
    const doFetch = () => useAppStore.getState().fetchCustomerOrders();
    doFetch();
    const interval = setInterval(doFetch, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open payment dialog when returning from /antrean with openPayment flag
  React.useEffect(() => {
    const state = location.state as { openPayment?: boolean } | null;
    if (state?.openPayment) {
      setShowCartOnMobile(true);
      setIsPaymentOpen(true);
      // Clean history state without triggering route remount loops
      window.history.replaceState(null, '');
    }
  }, [location.state]);

  const toggleViewMode = () => {
    const nextMode = viewMode === 'card' ? 'list' : 'card';
    setViewMode(nextMode);
    localStorage.setItem('cafepos_menu_view_mode', nextMode);
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

  const { subtotal, discountAmount, taxAmount, serviceCharge, grandTotal } = React.useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
    const disc = discountType === 'percentage' 
      ? Math.round((sub * discountValue) / 100)
      : discountValue;
    const after = Math.max(0, sub - disc);
    const tax = enableTax ? Math.round((after * taxRate) / 100) : 0;
    const service = Math.round((after * serviceRate) / 100);
    const grand = Math.round(after + tax + service);
    return { subtotal: sub, discountAmount: disc, afterDiscount: after, taxAmount: tax, serviceCharge: service, grandTotal: grand };
  }, [cart, discountType, discountValue, enableTax, taxRate, serviceRate]);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Coffee': return <Coffee className="w-5 h-5" />;
      case 'CupSoda': return <CupSoda className="w-5 h-5" />;
      case 'Cookie': return <Cookie className="w-5 h-5" />;
      case 'Utensils': return <Utensils className="w-5 h-5" />;
      case 'IceCream': return <IceCream className="w-5 h-5" />;
      default: return <Grid className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-bgmain overflow-hidden select-none font-sans">
      
      {/* TOP BAR */}
      <header className="h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-2 sm:px-4 flex items-center justify-between shrink-0 shadow-sm z-10 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="bg-coffee-500 text-white font-black px-2.5 py-1.5 rounded-xl text-sm sm:text-base tracking-wider flex items-center gap-1.5">
            <Coffee className="w-4 h-4" />
            <span className="hidden xs:inline">CafePOS</span>
          </div>
          
          <span className={`text-[10px] md:text-xs px-2 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
            isDatabaseMode 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDatabaseMode ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span className="hidden xs:inline">{isDatabaseMode ? 'Online' : 'Offline'}</span>
          </span>

          {pendingSales.length > 0 && (
            <button
              onClick={() => syncOfflineSales()}
              className="text-[9px] md:text-[10px] bg-coffee-50 border border-coffee-200 text-coffee-700 px-2 py-1 rounded-lg font-extrabold hover:bg-coffee-100 transition flex items-center gap-1"
              title="Sinkronkan Transaksi Offline"
            >
              🔄 {pendingSales.length}
            </button>
          )}
        </div>

        {/* Search & Main Action Controls */}
        <div className="relative flex-1 max-w-xs sm:max-w-md flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            />
          </div>

          <button
            onClick={toggleViewMode}
            className="p-1.5 sm:p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 rounded-xl border border-stone-200 dark:border-stone-700 transition shrink-0"
            title={viewMode === 'card' ? 'Ubah ke Mode List' : 'Ubah ke Mode Grid'}
          >
            {viewMode === 'card' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          </button>
          
          {/* Desktop Direct Action Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => navigate('/antrean')}
              className="relative p-2 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl transition shrink-0 font-bold flex items-center gap-1.5 text-xs shadow-sm"
              title="Antrean Pesanan Pelanggan"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Antrean</span>
              {useAppStore.getState().customerOrders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow border border-white">
                  {useAppStore.getState().customerOrders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl border border-stone-200 dark:border-stone-700 transition shrink-0 font-bold flex items-center gap-1.5 text-xs"
              title="Riwayat Transaksi"
            >
              <History className="w-3.5 h-3.5 text-coffee-500" />
              <span>Riwayat</span>
            </button>
          </div>
        </div>

        {/* Right Desktop Info & Actions */}
        <div className="hidden md:flex items-center gap-2 md:gap-3 text-xs font-medium text-stone-600 shrink-0">
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <User className="w-3.5 h-3.5 text-coffee-500" />
            <span className="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[80px]">{currentUser?.full_name}</span>
          </div>

          {activeShift && (
            <button
              onClick={() => setShowCloseShift(true)}
              className="flex items-center gap-1 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition text-xs font-semibold"
              title="Tutup Shift"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Tutup Shift</span>
            </button>
          )}

          {onSwitchToBackOffice && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
            <button
              onClick={onSwitchToBackOffice}
              className="p-2 bg-coffee-50 hover:bg-coffee-100 text-coffee-600 rounded-xl border border-coffee-200 transition font-bold flex items-center gap-1.5 text-xs"
              title="Ke Back Office"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Back Office</span>
            </button>
          )}

          <button
            onClick={logout}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300 rounded-xl border border-stone-200 dark:border-stone-700 transition"
            title="Keluar Kasir"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile 3-Dots Menu Dropdown Button */}
        <div className="relative md:hidden shrink-0">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl border border-stone-200 dark:border-stone-700 transition flex items-center justify-center relative"
            title="Menu Lainnya"
          >
            <MoreVertical className="w-4 h-4" />
            {useAppStore.getState().customerOrders.filter(o => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
            )}
          </button>

          {/* Mobile Dropdown Menu Popover */}
          {showMobileMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMobileMenu(false)} 
              />
              <div className="absolute right-0 top-12 w-52 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-1">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Kasir Saat Ini</p>
                  <p className="text-xs font-extrabold text-stone-800 dark:text-stone-100 truncate">{currentUser?.full_name}</p>
                </div>

                <button
                  onClick={() => { setShowMobileMenu(false); navigate('/antrean'); }}
                  className="w-full px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-coffee-50 dark:hover:bg-stone-800 rounded-xl flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-coffee-500" />
                    <span>Antrean Pesanan</span>
                  </span>
                  {useAppStore.getState().customerOrders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {useAppStore.getState().customerOrders.filter(o => o.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setShowMobileMenu(false); setShowHistoryModal(true); }}
                  className="w-full px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-coffee-50 dark:hover:bg-stone-800 rounded-xl flex items-center gap-2 transition"
                >
                  <History className="w-4 h-4 text-coffee-500" />
                  <span>Riwayat Transaksi</span>
                </button>

                {activeShift && (
                  <button
                    onClick={() => { setShowMobileMenu(false); setShowCloseShift(true); }}
                    className="w-full px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl flex items-center gap-2 transition"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>Tutup Shift & Kas</span>
                  </button>
                )}

                {onSwitchToBackOffice && (currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
                  <button
                    onClick={() => { setShowMobileMenu(false); onSwitchToBackOffice(); }}
                    className="w-full px-3 py-2 text-xs font-bold text-coffee-600 dark:text-coffee-400 hover:bg-coffee-50 dark:hover:bg-stone-800 rounded-xl flex items-center gap-2 transition"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Back Office</span>
                  </button>
                )}

                <div className="border-t border-stone-100 dark:border-stone-800 pt-1 mt-1">
                  <button
                    onClick={() => { setShowMobileMenu(false); logout(); }}
                    className="w-full px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Shift Gate Overlay — only for Cashier role */}
      {!activeShift && currentUser?.role === 'Cashier' && <ShiftGateScreen />}

      {/* Close Shift Modal */}
      <CloseShiftModal isOpen={showCloseShift} onClose={() => setShowCloseShift(false)} />
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: Categories */}
        <aside className={`${showCartOnMobile ? 'hidden' : 'flex'} w-16 sm:w-20 md:w-28 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 p-1 md:p-2 flex-col gap-1.5 md:gap-2 shrink-0 overflow-y-auto`}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex flex-col items-center justify-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition touch-active ${
              selectedCategory === 'all'
                ? 'bg-coffee-500 text-white font-bold shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Grid className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            <span className="text-[10px] md:text-[11px] font-medium text-center">Semua</span>
          </button>

          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-2.5 md:p-3 rounded-xl md:rounded-2xl transition touch-active ${
                  active
                    ? 'bg-coffee-500 text-white font-bold shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <div className="mb-1 transform scale-90 md:scale-100">{getCategoryIcon(cat.icon)}</div>
                <span className="text-[10px] md:text-[11px] text-center leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </aside>

        {/* CENTER COLUMN: Product Grid / List Tiles */}
        <main className={`${showCartOnMobile ? 'hidden lg:block' : 'block'} flex-1 p-2 md:p-4 overflow-y-auto bg-stone-50/50`}>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {filteredProducts.map((product) => {
                const matchedRecipe = recipes.find(r => r.product_id === product.id);
                const isOutOfStock = matchedRecipe && matchedRecipe.items && matchedRecipe.items.length > 0 && matchedRecipe.items.some((rItem) => {
                  const matchedIng = ingredients.find(ing => ing.id === rItem.ingredient_id);
                  return matchedIng && matchedIng.current_stock <= 0;
                });

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col touch-active group"
                  >
                    <div className="h-24 md:h-32 w-full overflow-hidden bg-stone-100 relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {product.is_favorite && (
                        <span className="absolute top-1.5 left-1.5 bg-coffee-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                          ★ Favorit
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow animate-pulse flex items-center gap-0.5 z-10">
                          <AlertTriangle className="w-2.5 h-2.5" /> Bahan Baku Habis
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 md:p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-bold text-xs md:text-sm text-stone-800 dark:text-stone-100 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{product.sku}</p>
                      </div>
                      <div className="mt-1.5 md:mt-2 flex justify-between items-center">
                        <span className="font-extrabold text-xs md:text-sm text-coffee-600 dark:text-coffee-400">
                          Rp {product.selling_price.toLocaleString('id-ID')}
                        </span>
                        <button className="p-1 md:p-1.5 bg-stone-100 hover:bg-coffee-500 hover:text-white rounded-lg md:rounded-xl transition">
                          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProducts.map((product) => {
                const matchedRecipe = recipes.find(r => r.product_id === product.id);
                const isOutOfStock = matchedRecipe && matchedRecipe.items && matchedRecipe.items.length > 0 && matchedRecipe.items.some((rItem) => {
                  const matchedIng = ingredients.find(ing => ing.id === rItem.ingredient_id);
                  return matchedIng && matchedIng.current_stock <= 0;
                });

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer touch-active group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">
                            {product.name}
                          </h3>
                          {product.is_favorite && (
                            <span className="bg-coffee-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full">
                              ★ Favorit
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Bahan Baku Habis
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono">{product.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-sm text-coffee-600 dark:text-coffee-400">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>
                      <button className="p-1.5 bg-stone-100 hover:bg-coffee-500 hover:text-white rounded-lg transition">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Shopping Cart */}
        <aside className={`${showCartOnMobile ? 'flex' : 'hidden'} lg:flex w-full lg:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex-col shrink-0 shadow-lg`}>
          
          <div className="p-3 border-b border-stone-200 dark:border-stone-800 space-y-2">
            <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
              {[
                { id: 'dine_in', label: 'Dine In', icon: UtensilsCrossed },
                { id: 'take_away', label: 'Take Home', icon: ShoppingBag },
                { id: 'delivery', label: 'Delivery', icon: Truck },
              ].map((t) => {
                const Icon = t.icon;
                const active = orderType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setOrderType(t.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                      active ? 'bg-white text-coffee-600 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                <span className="text-stone-500 font-medium shrink-0">Nama Pelanggan:</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Pelanggan Umum"
                  className="w-40 text-right font-bold text-stone-800 bg-transparent focus:outline-none placeholder:font-normal"
                />
              </div>

              {enableTableNumber && orderType === 'dine_in' && (
                <div className="flex items-center justify-between bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-500 font-medium">Nomor Meja:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="bg-transparent font-bold text-coffee-600 focus:outline-none cursor-pointer"
                  >
                    {tables.map((tbl) => (
                      <option key={tbl.id} value={tbl.table_number}>
                        Meja {tbl.table_number} ({tbl.capacity} kursi)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                <p className="text-xs font-medium">Keranjang masih kosong</p>
                <p className="text-[11px] text-stone-300">Pilih menu di sebelah kiri untuk menambah</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-coffee-600 font-semibold mt-0.5">
                        Rp {(item.product.selling_price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-stone-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      placeholder="Tambah catatan..."
                      value={item.notes || ''}
                      onChange={(e) => updateCartNotes(item.product.id, e.target.value)}
                      className="text-[10px] bg-white border border-stone-200 rounded px-2 py-1 w-36 focus:outline-none"
                    />

                    <div className="flex items-center gap-2 bg-white rounded-lg border border-stone-200 px-1 py-0.5">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="p-1 text-stone-600 hover:bg-stone-100 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="p-1 text-stone-600 hover:bg-stone-100 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-2">
            <div className="space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>

              {discountValue > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Diskon {discountType === 'percentage' ? `(${discountValue}%)` : ''}</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              {enableTax && (
                <div className="flex justify-between">
                  <span>Pajak ({taxRate}%)</span>
                  <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Layanan ({serviceRate}%)</span>
                <span>Rp {serviceCharge.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-stone-800 dark:text-stone-100 pt-1 border-t border-stone-200">
                <span>Total Akhir</span>
                <span className="text-coffee-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setTempDiscount(discountValue.toString());
                  setModalDiscType(discountType);
                  setShowDiscountModal(true);
                }}
                className="flex-1 py-1.5 border border-stone-300 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-white flex items-center justify-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                Diskon
              </button>
              <button
                onClick={clearCart}
                className="py-1.5 px-3 border border-stone-300 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-white flex items-center justify-center"
              >
                Kosongkan
              </button>
            </div>

          <button
              disabled={cart.length === 0}
              onClick={() => setIsPaymentOpen(true)}
              className={`w-full py-3 md:py-3.5 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-md transition touch-active ${
                cart.length === 0
                  ? 'bg-stone-300 cursor-not-allowed'
                  : 'bg-coffee-500 hover:bg-coffee-600'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>BAYAR • Rp {grandTotal.toLocaleString('id-ID')}</span>
            </button>

            {/* Discrete Kembali button (underneath BAYAR on mobile & tablet screens inside the cart view) */}
            {showCartOnMobile && (
              <button
                onClick={() => setShowCartOnMobile(false)}
                className="lg:hidden w-full py-3 bg-stone-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>← Kembali Pilih Menu</span>
              </button>
            )}
          </div>

        </aside>

        {/* Mobile & Tablet Cart Floating Action Bar */}
        {!showCartOnMobile && (
          <div className="lg:hidden absolute bottom-3 left-3 right-3 z-30 flex items-center gap-2">
            <button
              onClick={() => setShowCartOnMobile(true)}
              className="flex-1 py-3.5 bg-coffee-500 hover:bg-coffee-600 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Keranjang ({cart.reduce((a, b) => a + b.quantity, 0)}) • Rp {grandTotal.toLocaleString('id-ID')}</span>
            </button>
          </div>
        )}
      </div>

      <PaymentDialog 
        isOpen={isPaymentOpen} 
        onClose={() => {
          setIsPaymentOpen(false);
          setShowCartOnMobile(false);
        }} 
      />

      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-xl border border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100">Terapkan Diskon Pesanan</h3>
            
            {/* Mode Selector Toggle */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setModalDiscType('percentage');
                  if (modalDiscType !== 'percentage') setTempDiscount('10');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  modalDiscType === 'percentage'
                    ? 'bg-white dark:bg-stone-700 text-coffee-600 dark:text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Persentase (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalDiscType('fixed');
                  if (modalDiscType !== 'fixed') setTempDiscount('5000');
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  modalDiscType === 'fixed'
                    ? 'bg-white dark:bg-stone-700 text-coffee-600 dark:text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Nominal (Rp)
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {modalDiscType === 'percentage' ? 'Persen Diskon (%)' : 'Jumlah Nominal (Rp)'}
              </label>
              <input
                type="number"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-800 dark:text-stone-100 px-3 py-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder={modalDiscType === 'percentage' ? 'Contoh: 10' : 'Contoh: 10000'}
                min="0"
                max={modalDiscType === 'percentage' ? '100' : undefined}
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 py-2 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(tempDiscount) || 0;
                  setDiscount(modalDiscType, val);
                  setShowDiscountModal(false);
                }}
                className="flex-1 py-2 bg-coffee-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-coffee-600 transition"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
