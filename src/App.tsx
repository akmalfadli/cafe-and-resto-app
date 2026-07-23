import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PosScreen } from './features/pos/PosScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { CustomerMenuView } from './features/pos/CustomerMenuView';
import { CustomerOrdersQueuePage } from './features/pos/CustomerOrdersQueuePage';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

// Code-split BackOfficeLayout to reduce initial bundle size for POS screen on slow tablets
const BackOfficeLayout = React.lazy(() => import('./features/backoffice/BackOfficeLayout').then(m => ({ default: m.BackOfficeLayout })));

// Extracted as a stable top-level component so React never remounts PosScreen
// due to App re-renders (which previously happened because App subscribed to the
// entire Zustand store, causing StaffLayout's component identity to change on
// every store mutation and destroying PosScreen's local state like isPaymentOpen).
const StaffLayout: React.FC<{
  currentAppMode: 'pos' | 'backoffice';
  setCurrentAppMode: (mode: 'pos' | 'backoffice') => void;
}> = ({ currentAppMode, setCurrentAppMode }) => {
  const currentUser = useAppStore(s => s.currentUser);
  const isStaffManagerOrOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Manager';

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans">
      {currentAppMode === 'pos' || !isStaffManagerOrOwner ? (
        <PosScreen onSwitchToBackOffice={() => setCurrentAppMode('backoffice')} />
      ) : (
        <React.Suspense fallback={
          <div className="h-screen w-screen bg-stone-900 flex flex-col items-center justify-center text-white space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-coffee-400" />
            <p className="text-xs font-bold">Memuat Back Office...</p>
          </div>
        }>
          <BackOfficeLayout onSwitchToPos={() => setCurrentAppMode('pos')} />
        </React.Suspense>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  const [currentAppMode, setCurrentAppMode] = React.useState<'pos' | 'backoffice'>('pos');
  // Fine-grained selectors: only subscribe to what App actually needs
  const currentUser = useAppStore(s => s.currentUser);
  const fetchInitialData = useAppStore(s => s.fetchInitialData);
  const isLoading = useAppStore(s => s.isLoading);

  // Network Status and Auto Syncer loop hook

  useEffect(() => {
    const handleOnline = () => {
      useAppStore.getState().setDatabaseMode(true);
      useAppStore.getState().syncOfflineSales();
    };
    const handleOffline = () => {
      useAppStore.getState().setDatabaseMode(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    useAppStore.getState().setDatabaseMode(navigator.onLine);
    if (navigator.onLine) {
      useAppStore.getState().syncOfflineSales();
    }

    // Auto POS syncer background loop every 35 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        useAppStore.getState().syncOfflineSales();
      }
    }, 35000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

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

  return (
    <Routes>
      {/* Route for public customers menu, accessible without auth check */}
      <Route path="/menu" element={<CustomerMenuView />} />
      {/* Staff-only queue page (requires login via StaffLayout parent guard) */}
      <Route path="/antrean" element={currentUser ? <CustomerOrdersQueuePage /> : <LoginScreen />} />
      {/* Staff gate routes */}
      <Route path="*" element={<StaffLayout currentAppMode={currentAppMode} setCurrentAppMode={setCurrentAppMode} />} />
    </Routes>
  );
};

export default App;

