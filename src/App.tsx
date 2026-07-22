import React, { useEffect } from 'react';
import { PosScreen } from './features/pos/PosScreen';
import { BackOfficeLayout } from './features/backoffice/BackOfficeLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { Shield, Monitor, LogOut, Database, RefreshCw } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const [currentAppMode, setCurrentAppMode] = React.useState<'pos' | 'backoffice'>('pos');
  const { currentUser, fetchInitialData, logout, isDatabaseMode, isLoading } = useAppStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-stone-900 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <RefreshCw className="w-10 h-10 animate-spin text-coffee-400" />
        <p className="text-sm font-bold tracking-wider">Menghubungkan ke Database Supabase...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const isStaffManagerOrOwner = currentUser.role === 'Owner' || currentUser.role === 'Manager';

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans">
      {/* Floating Toolbar */}
      <div className="fixed bottom-4 left-4 z-50 bg-stone-900/90 backdrop-blur-md text-white p-1.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-1">
        <button
          onClick={() => setCurrentAppMode('pos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            currentAppMode === 'pos'
              ? 'bg-coffee-500 text-white shadow'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Kasir POS</span>
        </button>

        {isStaffManagerOrOwner && (
          <button
            onClick={() => setCurrentAppMode('backoffice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              currentAppMode === 'backoffice'
                ? 'bg-coffee-500 text-white shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Back Office</span>
          </button>
        )}

        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border ${
          isDatabaseMode ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
        }`}>
          <Database className="w-3 h-3" />
          <span>{isDatabaseMode ? 'Online' : 'Offline'}</span>
        </span>

        <button
          onClick={logout}
          className="p-1.5 text-stone-400 hover:text-red-400 transition ml-1"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {currentAppMode === 'pos' || !isStaffManagerOrOwner ? (
        <PosScreen />
      ) : (
        <BackOfficeLayout onSwitchToPos={() => setCurrentAppMode('pos')} />
      )}
    </div>
  );
};

export default App;
