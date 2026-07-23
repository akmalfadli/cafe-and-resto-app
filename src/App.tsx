import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PosScreen } from './features/pos/PosScreen';
import { BackOfficeLayout } from './features/backoffice/BackOfficeLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { CustomerMenuView } from './features/pos/CustomerMenuView';
import { Shield, Monitor, RefreshCw } from 'lucide-react';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const [currentAppMode, setCurrentAppMode] = React.useState<'pos' | 'backoffice'>('pos');
  const { currentUser, fetchInitialData, isLoading } = useAppStore();

  const isStaffManagerOrOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Manager';

  // Draggable position coordinates for the floating toolbar (Declared above conditional returns)
  const [position, setPosition] = React.useState({ x: window.innerWidth - 320, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const toolbarPosRef = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    toolbarPosRef.current = { ...position };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      // Calculate boundaries to keep the toolbar within the viewport
      const newX = Math.max(10, Math.min(window.innerWidth - 300, toolbarPosRef.current.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, toolbarPosRef.current.y + dy));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Adjust positioning on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(window.innerWidth - 300, prev.x),
        y: Math.min(window.innerHeight - 60, prev.y)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        {/* Floating Toolbar (Only visible on tablet/desktop md:flex, hidden on mobile) */}
        <div 
          onMouseDown={handleMouseDown}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className={`hidden md:flex fixed z-50 bg-stone-900/90 backdrop-blur-md text-white p-1.5 rounded-2xl shadow-2xl border border-stone-700 items-center gap-1 cursor-move select-none touch-none ${
            isDragging ? 'opacity-70 scale-95' : 'transition-transform duration-150 hover:scale-102'
          }`}
        >
          <button
            onClick={() => setCurrentAppMode('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition pointer-events-auto ${currentAppMode === 'pos'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition pointer-events-auto ${currentAppMode === 'backoffice'
                  ? 'bg-coffee-500 text-white shadow'
                  : 'text-stone-400 hover:text-white'
                }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Back Office</span>
            </button>
          )}
        </div>

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
