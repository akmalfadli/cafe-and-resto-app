import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  LayoutDashboard, Package, BookOpen, 
  BarChart3, Coffee, ChevronRight, ShoppingBag, 
  Grid, Building2, Users, Settings, Timer, Menu, X, LogOut, Monitor
} from 'lucide-react';
import { DashboardView } from './DashboardView';
import { ProductsView } from './ProductsView';
import { IngredientsView } from './IngredientsView';
import { ReportsView } from './ReportsView';
import { AttendanceView } from './AttendanceView';
import { CategoriesView } from './CategoriesView';
import { SuppliersView } from './SuppliersView';
import { UsersView } from './UsersView';
import { SettingsView } from './SettingsView';
import { TablesView } from './TablesView';
import { ShiftsView } from './ShiftsView';
import { UtensilsCrossed, Clock } from 'lucide-react';

interface BackOfficeLayoutProps {
  onSwitchToPos: () => void;
}

export const BackOfficeLayout: React.FC<BackOfficeLayoutProps> = ({ onSwitchToPos }) => {
  const { currentUser, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'categories' | 'tables' | 'ingredients' | 'suppliers' | 'reports' | 'attendance' | 'shifts' | 'users' | 'settings'
  >(() => {
    return (localStorage.getItem('cafepos_backoffice_tab') as any) || 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    localStorage.setItem('cafepos_backoffice_tab', tab);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dasbor Eksekutif', icon: LayoutDashboard },
    { id: 'products', label: 'Produk & Resep', icon: Package },
    { id: 'categories', label: 'Kategori Menu', icon: Grid },
    { id: 'tables', label: 'Manajemen Meja', icon: UtensilsCrossed },
    { id: 'ingredients', label: 'Bahan Baku & Stok', icon: BookOpen },
    { id: 'suppliers', label: 'Pemasok (Supplier)', icon: Building2 },
    { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3 },
    { id: 'attendance', label: 'Daftar Kehadiran', icon: Clock },
    { id: 'shifts', label: 'Shift Kasir', icon: Timer },
    { id: 'users', label: 'Pengguna & Peran', icon: Users },
    { id: 'settings', label: 'Pengaturan Outlet', icon: Settings },
  ];

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-stone-100 overflow-hidden font-sans select-none relative">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden h-14 bg-stone-900 text-white px-4 flex items-center justify-between shrink-0 shadow-md z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-sm tracking-wider">Back Office</span>
        </div>
        <button
          onClick={onSwitchToPos}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-500 hover:bg-coffee-600 rounded-xl text-xs font-bold transition"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>POS</span>
        </button>
      </header>
      
      {/* SIDEBAR NAVIGATION (Desktop: visible aside, Mobile: overlay drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-stone-900 text-white flex flex-col justify-between shrink-0 shadow-2xl z-40 md:relative md:translate-x-0 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-coffee-500 rounded-xl">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-black text-base tracking-wider leading-tight">CafePOS</h2>
                <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest">Back Office</span>
              </div>
            </div>
            {/* Close button for mobile menu drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 hover:bg-stone-800 rounded-lg text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              onSwitchToPos();
              setIsMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-coffee-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-between border border-stone-700 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-coffee-400" />
              <span>Buka Kasir POS</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-coffee-500 text-white shadow-md font-bold'
                      : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Credit Link */}
        <div className="px-5 py-2.5 text-center text-[10px] text-stone-500 border-t border-stone-800/80">
          Created with ❤️ by <a href="https://akmalfadli.github.io" target="_blank" rel="noopener noreferrer" className="text-coffee-400 hover:text-coffee-300 font-bold hover:underline transition">Akmal Fadli</a>
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-bold text-stone-200">{currentUser?.full_name}</p>
            <p className="text-[10px] text-coffee-400 font-semibold">{currentUser?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-red-400 rounded-lg transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Overlay backdrop when mobile drawer is open */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'categories' && <CategoriesView />}
        {activeTab === 'tables' && <TablesView />}
        {activeTab === 'ingredients' && <IngredientsView />}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'shifts' && <ShiftsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

    </div>
  );
};
