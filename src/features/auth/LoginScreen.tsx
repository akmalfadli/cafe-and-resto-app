import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Coffee, User, Delete, UserPlus, Shield } from 'lucide-react';
import type { Profile } from '../../types';

export const LoginScreen: React.FC = () => {
  const { profiles, setCurrentUser, registerOwnerAccount, loginWithOwnerPassword } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [pin, setPin] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Security Lock Form State
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Owner Registration Form State
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  // Monitor Lock Expiry Countdown
  React.useEffect(() => {
    if (!lockUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lockUntil - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        setLockUntil(null);
        setFailedAttempts(0);
        setError('');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handlePinPress = (digit: string) => {
    if (lockUntil && Date.now() < lockUntil) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockUntil && Date.now() < lockUntil) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = (inputPin: string) => {
    if (!selectedUser) return;
    if (selectedUser.pin_code === inputPin) {
      setCurrentUser(selectedUser);
      setFailedAttempts(0);
      setLockUntil(null);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPin('');
      
      if (nextAttempts >= 5) {
        const lockTime = Date.now() + 5 * 60 * 1000; // 5 minutes lock
        setLockUntil(lockTime);
        setSecondsRemaining(300);
        setError('Terlalu banyak percobaan salah. Akun dikunci selama 5 menit.');
      } else {
        setError(`Kode PIN salah. Sisa percobaan: ${5 - nextAttempts}x.`);
      }
    }
  };

  const handleOwnerPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    setError('');
    try {
      const authenticatedOwner = await loginWithOwnerPassword(selectedUser.email, passwordInput);
      setCurrentUser(authenticatedOwner);
    } catch (err: any) {
      setError(err?.message || 'Kata sandi salah. Silakan coba lagi.');
      setPasswordInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerEmail || !ownerPassword || ownerPin.length !== 6) {
      setError('Harap isi semua kolom, kata sandi (min. 6 karakter), dan 6 digit PIN.');
      return;
    }

    if (ownerPassword.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      const registered = await registerOwnerAccount(ownerName, ownerEmail, ownerPin, ownerPassword);
      setCurrentUser(registered);
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftarkan akun.');
    }
  };

  return (
    <div className="h-screen w-screen bg-stone-900 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-800 flex flex-col">
        
        {/* Header */}
        <div className="bg-coffee-500 p-6 text-white text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-wider">CAFE POS RESTO</h1>
          <p className="text-xs text-coffee-200">Portal Kasir & Management Back Office</p>
        </div>

        {/* 1. Registration Mode */}
        {isRegisterMode ? (
          <form onSubmit={handleRegisterOwner} className="p-6 space-y-3.5 text-xs">
            <div className="text-center space-y-1">
              <h2 className="font-bold text-base text-stone-800">Pendaftaran Akun Pemilik (Owner)</h2>
              <p className="text-stone-400">Daftarkan akun utama resto untuk mengelola akun kasir & manajer</p>
            </div>

            {error && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{error}</p>}

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Nama Lengkap Pemilik</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-600 block mb-1">Email Resto / Usaha</label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-2 font-medium focus:outline-none"
                placeholder="owner@cafepos.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-600 block mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 font-medium focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">PIN Kasir (6 Digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 font-mono text-center font-bold text-base focus:outline-none"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow transition"
              >
                Daftar & Masuk ke Resto
              </button>

              {profiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="w-full py-2 text-stone-500 font-semibold hover:underline"
                >
                  Kembali ke Pilihan Akun
                </button>
              )}
            </div>
          </form>
        ) : (
          /* 2. Login User Selector & PIN Entry */
          !selectedUser ? (
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Pilih Akun
                </label>
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="text-xs text-coffee-600 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Daftar Pemilik Baru
                </button>
              </div>

              {profiles.length === 0 ? (
                <div className="p-6 text-center space-y-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  <Shield className="w-8 h-8 text-coffee-500 mx-auto" />
                  <div>
                    <h3 className="font-bold text-sm text-stone-800">Belum Ada Akun Terdaftar</h3>
                    <p className="text-xs text-stone-500">Daftarkan akun Pemilik (Owner) pertama untuk resto Anda.</p>
                  </div>
                  <button
                    onClick={() => setIsRegisterMode(true)}
                    className="px-4 py-2 bg-coffee-500 text-white rounded-xl font-bold text-xs shadow"
                  >
                    Daftar Akun Pemilik
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {/* Management section */}
                  {(() => {
                    const mgmt = profiles.filter((u) => u.role === 'Owner' || u.role === 'Manager');
                    const cashiers = profiles.filter((u) => u.role === 'Cashier' || u.role === 'Kitchen');
                    return (
                      <>
                        {mgmt.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 px-1">
                              Manajemen
                            </p>
                            <div className="space-y-2">
                              {mgmt.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() => setSelectedUser(u)}
                                  className="w-full p-3.5 rounded-2xl border border-coffee-200 bg-coffee-50/40 hover:border-coffee-500 hover:bg-coffee-50 transition flex items-center justify-between group touch-active text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-coffee-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                      {u.full_name.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-sm text-stone-800">{u.full_name}</h3>
                                      <p className="text-xs text-stone-400 font-medium">{u.email}</p>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                                    u.role === 'Owner'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {u.role}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No management accounts — show prompt */}
                        {mgmt.length === 0 && (
                          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs">
                            <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-800 mb-0.5">Belum ada akun Owner / Manager</p>
                              <p className="text-amber-600">Klik <strong>"Daftar Pemilik Baru"</strong> di atas untuk membuat akun manajemen pertama.</p>
                            </div>
                          </div>
                        )}

                        {cashiers.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 px-1">
                              Kasir & Dapur
                            </p>
                            <div className="space-y-2">
                              {cashiers.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() => setSelectedUser(u)}
                                  className="w-full p-3.5 rounded-2xl border border-stone-200 hover:border-coffee-500 hover:bg-coffee-50/50 transition flex items-center justify-between group touch-active text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-coffee-500 group-hover:text-white flex items-center justify-center transition font-bold text-stone-700 shrink-0">
                                      <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-sm text-stone-800">{u.full_name}</h3>
                                      <p className="text-xs text-stone-400 font-medium">{u.email}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-stone-100 text-stone-600 group-hover:bg-coffee-100 group-hover:text-coffee-800 shrink-0">
                                    {u.role}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : selectedUser.role === 'Owner' ? (
            /* Owner Password Entry Step */
            <form onSubmit={handleOwnerPasswordSubmit} className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Masuk sebagai Owner</span>
                  <h3 className="font-bold text-sm text-stone-800">{selectedUser.full_name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setPasswordInput('');
                    setError('');
                  }}
                  className="text-xs text-coffee-600 font-semibold hover:underline"
                >
                  Ganti Akun
                </button>
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Masukkan Kata Sandi Akun</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError('');
                  }}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !passwordInput}
                className="w-full py-3 bg-coffee-500 hover:bg-coffee-600 disabled:opacity-55 text-white font-bold rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk ke Back Office'}
              </button>
            </form>
          ) : (
            /* Staff / Manager PIN Entry Step */
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b pb-3 border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Masuk sebagai</span>
                  <h3 className="font-bold text-sm text-stone-800">{selectedUser.full_name}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setPin('');
                    setError('');
                  }}
                  className="text-xs text-coffee-600 font-semibold hover:underline"
                >
                  Ganti Akun
                </button>
              </div>

              <div className="text-center space-y-2">
                <label className="text-xs font-semibold text-stone-500">Masukkan 6 Digit PIN Keamanan</label>
                <div className="flex justify-center gap-3 py-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        pin.length > idx
                          ? 'bg-coffee-500 border-coffee-500 scale-110'
                          : 'border-stone-300 bg-stone-100'
                      }`}
                    />
                  ))}
                </div>
                {error && <p className="text-xs text-red-500 font-semibold animate-shake">{error}</p>}
                
                {lockUntil && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-bold mt-2 border border-red-200/50">
                    Akun terkunci. Coba lagi dalam: {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}d
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 relative">
                {lockUntil && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-stone-900/40 backdrop-blur-[1px] z-10 rounded-2xl cursor-not-allowed" />
                )}
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinPress(digit)}
                    disabled={!!lockUntil}
                    className="h-14 rounded-2xl bg-stone-50 hover:bg-coffee-50 hover:border-coffee-300 border border-stone-200 text-lg font-bold text-stone-800 shadow-sm touch-active transition flex items-center justify-center disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}
                <div className="h-14" />
                <button
                  onClick={() => handlePinPress('0')}
                  disabled={!!lockUntil}
                  className="h-14 rounded-2xl bg-stone-50 hover:bg-coffee-50 hover:border-coffee-300 border border-stone-200 text-lg font-bold text-stone-800 shadow-sm touch-active transition flex items-center justify-center disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!!lockUntil}
                  className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 shadow-sm touch-active transition flex items-center justify-center disabled:opacity-50"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        )}

      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-stone-500 font-medium">
        Created with ❤️ by <a href="https://akmalfadli.github.io" target="_blank" rel="noopener noreferrer" className="text-coffee-400 hover:text-coffee-300 font-bold hover:underline transition">Akmal Fadli</a>
      </div>
    </div>
  );
};
