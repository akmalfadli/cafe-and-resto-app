import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { UserCheck, Key, Plus, X } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { profiles, createStaffAccount, updateProfilePin } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Manager' | 'Cashier'>('Cashier');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || pinCode.length !== 6) {
      setError('Harap isi semua kolom, kata sandi (min. 6 karakter), dan 6 digit PIN.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    try {
      await createStaffAccount(fullName, email, role, pinCode, password);
      setFullName('');
      setEmail('');
      setPassword('');
      setPinCode('');
      setShowModal(false);
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan akun staf.');
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      setPinError('PIN harus berupa 6 digit angka.');
      return;
    }
    try {
      if (selectedProfileId) {
        await updateProfilePin(selectedProfileId, newPin);
        setNewPin('');
        setSelectedProfileId(null);
        setShowPinModal(false);
        setPinError('');
      }
    } catch (err: any) {
      setPinError(err?.message || 'Gagal mengubah PIN.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Manajemen Pengguna & Peran</h1>
          <p className="text-xs text-stone-500">Kelola staf kasir, izin manajer, dan PIN keamanan</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Staf / Kasir Baru
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase">
            <tr>
              <th className="p-3">Pengguna</th>
              <th className="p-3">Email</th>
              <th className="p-3">Peran / Jabatan</th>
              <th className="p-3">PIN Keamanan</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {profiles.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="p-3">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <UserCheck className="w-4 h-4 text-coffee-500" />
                    <span>{u.full_name}</span>
                  </div>
                </td>
                <td className="p-3 text-stone-600">{u.email}</td>
                <td className="p-3">
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    u.role === 'Owner'
                      ? 'bg-purple-100 text-purple-800'
                      : u.role === 'Manager'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-coffee-100 text-coffee-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 font-mono font-bold text-stone-500 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-stone-400" />
                  <span>•••••• ({u.pin_code})</span>
                </td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    Aktif
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setSelectedProfileId(u.id);
                      setNewPin('');
                      setPinError('');
                      setShowPinModal(true);
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-coffee-500 hover:text-white text-stone-700 font-bold rounded-lg transition text-[10px]"
                  >
                    Ubah PIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">Tambah Staf (Manajer / Kasir)</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-coffee-600 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              {error && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{error}</p>}

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nama Lengkap Staf</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: Rina Kasir"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Email Staf</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                  placeholder="kasir@cafepos.com"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Jabatan / Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Cashier">Kasir (Cashier)</option>
                    <option value="Manager">Manajer (Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">PIN Kasir (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-mono text-center font-bold text-base focus:outline-none"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow"
                >
                  Simpan Staf Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-sm font-bold">Ubah PIN Keamanan</h2>
              <button 
                onClick={() => {
                  setShowPinModal(false);
                  setSelectedProfileId(null);
                }} 
                className="p-1 hover:bg-coffee-600 rounded-full"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleUpdatePin} className="p-6 space-y-4 text-xs">
              {pinError && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{pinError}</p>}

              <div>
                <label className="font-semibold text-stone-600 block mb-1.5">Masukkan PIN Baru (6 Digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-3 font-mono text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="••••••"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setSelectedProfileId(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
