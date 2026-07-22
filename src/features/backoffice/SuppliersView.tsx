import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Building2, Phone, Mail, MapPin, X } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier } = useAppStore();
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await addSupplier({
      name,
      contact_person: contactPerson,
      phone,
      email,
      address,
    });

    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Manajemen Pemasok (Supplier)</h1>
          <p className="text-xs text-stone-500">Kelola informasi kontak dan alamat vendor bahan baku</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-coffee-500 hover:bg-coffee-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Pemasok
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-coffee-50 text-coffee-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-800">{s.name}</h3>
                <p className="text-xs text-stone-500">Kontak: {s.contact_person}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 border-t pt-3 border-stone-100">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>{s.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{s.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{s.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-coffee-500 text-white p-5 flex justify-between items-center">
              <h2 className="text-lg font-bold">Tambah Pemasok Baru</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-coffee-600 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nama Perusahaan / Vendor</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Contoh: PT Kopi Nusantara"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nama Kontak Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                  placeholder="Contoh: Pak Andi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Email Vendor</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2.5 font-medium focus:outline-none"
                    placeholder="vendor@kopi.com"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Alamat Kantor / Gudang</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 font-medium focus:outline-none"
                  placeholder="Jl. Raya Kopi No. 10..."
                />
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
                  Simpan Pemasok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
