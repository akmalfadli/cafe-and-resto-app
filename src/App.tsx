import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PosScreen } from './features/pos/PosScreen';
import { BackOfficeLayout } from './features/backoffice/BackOfficeLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { CustomerMenuView } from './features/pos/CustomerMenuView';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const [currentAppMode, setCurrentAppMode] = React.useState<'pos' | 'backoffice'>('pos');
  const { currentUser, fetchInitialData, isLoading } = useAppStore();

  const isStaffManagerOrOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Manager';

  // Network Status and Auto Syncer loop hook
  const { setDatabaseMode, syncOfflineSales } = useAppStore();

  useEffect(() => {
    const handleOnline = () => {
      setDatabaseMode(true);
      syncOfflineSales();
    };
    const handleOffline = () => {
      setDatabaseMode(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setDatabaseMode(navigator.onLine);
    if (navigator.onLine) {
      syncOfflineSales();
    }

    // Auto POS syncer background loop every 10 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncOfflineSales();
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [setDatabaseMode, syncOfflineSales]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-stone-900 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <RefreshCw className="w-10 h-10 animate-spin text-coffee-400" />
        <p className="text-sm font-bold tracking-wider">Menghubungkan ke Server...</p>
      </div>
    );
  }

  // Master Layout component for staff-only areas
  const StaffLayout = () => {
    if (!currentUser) {
      return <LoginScreen />;
    }

    return (
      <div className="relative h-screen w-screen overflow-hidden font-sans">

        {currentAppMode === 'pos' || !isStaffManagerOrOwner ? (
          <PosScreen onSwitchToBackOffice={() => setCurrentAppMode('backoffice')} />
        ) : (
          <BackOfficeLayout onSwitchToPos={() => setCurrentAppMode('pos')} />
        )}
      </div>
    );
  };

  return (
    <Routes>
      {/* Route for public customers menu, accessible without auth check */}
      <Route path="/menu" element={<CustomerMenuView />} />
      {/* Staff gate routes */}
      <Route path="*" element={<StaffLayout />} />
    </Routes>
  );
};

export default App;
