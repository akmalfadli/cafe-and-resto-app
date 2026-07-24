import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { UserCheck, Key, Plus, X, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import type { Profile, RoleType } from '../../types';

export const UsersView: React.FC = () => {
  const { profiles, currentUser, createStaffAccount, updateStaffAccount, deleteStaffAccount, updateProfilePin } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Add Staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('Cashier');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  // Edit Staff form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('Cashier');
  const [editPinCode, setEditPinCode] = useState('');
  const [editError, setEditError] = useState('');

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

  const handleOpenEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setEditFullName(profile.full_name);
    setEditEmail(profile.email);
    setEditRole(profile.role);
    setEditPinCode(profile.pin_code || '');
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    if (!editFullName || !editEmail) {
      setEditError('Harap isi nama dan email.');
      return;
    }

    if (editPinCode && editPinCode.length !== 6) {
      setEditError('PIN harus 6 digit angka.');
      return;
    }

    try {
      await updateStaffAccount(editingProfile.id, editFullName, editEmail, editRole, editPinCode);
      setShowEditModal(false);
      setEditingProfile(null);
    } catch (err: any) {
      setEditError(err?.message || 'Gagal memperbarui data staf.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProfile) return;
    try {
      await deleteStaffAccount(deletingProfile.id);
      setShowDeleteModal(false);
      setDeletingProfile(null);
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + err?.message);
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
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">Manajemen Pengguna & Peran</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Kelola staf kasir, manajer, izin akses, dan PIN keamanan</p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Staf / Pengguna Baru
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold uppercase">
            <tr>
              <th className="p-3">Pengguna</th>
              <th className="p-3">Email</th>
              <th className="p-3">Peran / Jabatan</th>
              <th className="p-3">PIN Keamanan</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {profiles.map((u) => {
              const isSelf = currentUser?.id === u.id;

              return (
                <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-100">
                      <UserCheck className="w-4 h-4 text-coffee-500" />
                      <span>{u.full_name}</span>
                      {isSelf && (
                        <span className="text-[9px] bg-coffee-100 dark:bg-coffee-950/60 text-coffee-700 dark:text-coffee-300 font-black px-1.5 py-0.5 rounded">
                          (Anda)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-stone-600 dark:text-stone-300">{u.email}</td>
                  <td className="p-3">
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      u.role === 'Owner'
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                        : u.role === 'Manager'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        : u.role === 'Kitchen'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-coffee-100 dark:bg-coffee-950/60 text-coffee-800 dark:text-coffee-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                      <span>•••••• ({u.pin_code})</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                      Aktif
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedProfileId(u.id);
                          setNewPin('');
                          setPinError('');
                          setShowPinModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-coffee-500 hover:text-white text-stone-700 dark:text-stone-200 font-bold rounded-lg transition text-[10px]"
                        title="Ubah PIN Kasir"
                      >
                        PIN
                      </button>

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-blue-600 hover:text-white text-stone-700 dark:text-stone-200 font-bold rounded-lg transition"
                        title="Edit Data Pengguna"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => {
                            setDeletingProfile(u);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 font-bold rounded-lg transition"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">Tambah Pengguna / Staf Baru</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-coffee-600 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              {error && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{error}</p>}

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Nama Lengkap Staf</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: Rina Kasir"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Email Staf</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                  placeholder="kasir@cafepos.com"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Jabatan / Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Cashier">Kasir (Cashier)</option>
                    <option value="Manager">Manajer (Manager)</option>
                    <option value="Kitchen">Dapur (Kitchen)</option>
                    <option value="Owner">Pemilik (Owner)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">PIN Kasir (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-mono text-center font-bold text-base focus:outline-none"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
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

      {/* EDIT USER MODAL */}
      {showEditModal && editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="bg-blue-600 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">Edit Data Pengguna</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProfile(null);
                }} 
                className="p-1 hover:bg-blue-700 rounded-full"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4 text-xs">
              {editError && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{editError}</p>}

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">Peran / Jabatan</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="Cashier">Kasir (Cashier)</option>
                    <option value="Manager">Manajer (Manager)</option>
                    <option value="Kitchen">Dapur (Kitchen)</option>
                    <option value="Owner">Pemilik (Owner)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">PIN Kasir (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-mono text-center font-bold text-base focus:outline-none"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProfile(null);
                  }}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteModal && deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Hapus Pengguna Ini?</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-stone-800 dark:text-stone-200">{deletingProfile.full_name}</span> ({deletingProfile.email})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProfile(null);
                }}
                className="flex-1 py-2.5 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-sm font-bold">Ubah PIN Keamanan</h2>
              <button 
                onClick={() => {
                  setShowPinModal(false);
                  setSelectedProfileId(null);
                }} 
                className="p-1 hover:bg-coffee-600 rounded-full"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleUpdatePin} className="p-6 space-y-4 text-xs">
              {pinError && <p className="p-2 bg-red-50 text-red-600 rounded-xl text-center font-bold">{pinError}</p>}

              <div>
                <label className="font-semibold text-stone-600 dark:text-stone-300 block mb-1">PIN 6 Digit Baru</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl px-3 py-2.5 font-mono text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="••••••"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setSelectedProfileId(null);
                  }}
                  className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-coffee-500 hover:bg-coffee-600 text-white font-bold rounded-xl shadow"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
