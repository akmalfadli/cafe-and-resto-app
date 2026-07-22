import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  LayoutDashboard, Package, BookOpen, 
  BarChart3, Coffee, ChevronRight, ShoppingBag, 
  Grid, Building2, Users, Settings, Timer
} from 'lucide-react';
import { DashboardView } from './DashboardView';
import { ProductsView } from './ProductsView';
import { IngredientsView } from './IngredientsView';
import { ReportsView } from './ReportsView';
import { CategoriesView } from './CategoriesView';
import { SuppliersView } from './SuppliersView';
import { UsersView } from './UsersView';
import { SettingsView } from './SettingsView';
import { TablesView } from './TablesView';
import { ShiftsView } from './ShiftsView';
import { UtensilsCrossed } from 'lucide-react';

interface BackOfficeLayoutProps {
  onSwitchToPos: () => void;
}

export const BackOfficeLayout: React.FC<BackOfficeLayoutProps> = ({ onSwitchToPos }) => {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'categories' | 'tables' | 'ingredients' | 'suppliers' | 'reports' | 'shifts' | 'users' | 'settings'
  >('dashboard');

  return (
    <div className="h-screen w-screen flex bg-stone-100 overflow-hidden font-sans select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-stone-900 text-white flex flex-col justify-between shrink-0 shadow-2xl">
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-coffee-500 rounded-xl">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-wider leading-tight">CafePOS</h2>
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest">Back Office</span>
            </div>
          </div>

          <button
            onClick={onSwitchToPos}
            className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-coffee-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-between border border-stone-700 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-coffee-400" />
              <span>Buka Kasir POS</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dasbor Eksekutif', icon: LayoutDashboard },
              { id: 'products', label: 'Produk & Resep', icon: Package },
              { id: 'categories', label: 'Kategori Menu', icon: Grid },
              { id: 'tables', label: 'Manajemen Meja', icon: UtensilsCrossed },
              { id: 'ingredients', label: 'Bahan Baku & Stok', icon: BookOpen },
              { id: 'suppliers', label: 'Pemasok (Supplier)', icon: Building2 },
              { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3 },
              { id: 'shifts', label: 'Shift Kasir', icon: Timer },
              { id: 'users', label: 'Pengguna & Peran', icon: Users },
              { id: 'settings', label: 'Pengaturan Outlet', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
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

        <div className="p-4 border-t border-stone-800 bg-stone-950/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-200">{currentUser?.full_name}</p>
              <p className="text-[10px] text-coffee-400 font-semibold">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'categories' && <CategoriesView />}
        {activeTab === 'tables' && <TablesView />}
        {activeTab === 'ingredients' && <IngredientsView />}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'shifts' && <ShiftsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

    </div>
  );
};
