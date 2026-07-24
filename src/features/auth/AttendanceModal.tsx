import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { dbService } from '../../services/dbService';
import { Clock, MapPin, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import type { Profile } from '../../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Calculate distance between 2 coordinates in meters using Haversine Formula
export const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose }) => {
  const { profiles, outletLat, outletLng, maxAttendanceRadius, enableGpsValidation } = useAppStore();
  const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // GPS Location State
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gettingGps, setGettingGps] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStaff(null);
      setPin('');
      setNotes('');
      setTodayAttendance(null);
      setError(null);
      setSuccessMsg(null);
      setCurrentCoords(null);
      setDistanceMeters(null);
      setGpsError(null);
    }
  }, [isOpen]);

  // Request GPS Location
  const fetchCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS Geolocation.');
      return;
    }
    setGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCurrentCoords({ lat: userLat, lng: userLng });

        if (outletLat && outletLng) {
          const dist = calculateDistanceMeters(userLat, userLng, outletLat, outletLng);
          setDistanceMeters(dist);
        }
        setGettingGps(false);
      },
      (err) => {
        setGpsError('Gagal mengakses lokasi GPS: ' + err.message + '. Harap izinkan akses lokasi.');
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Check today's attendance when staff is selected
  const handleSelectStaff = async (staff: Profile) => {
    setSelectedStaff(staff);
    setPin('');
    setError(null);
    setSuccessMsg(null);
    setCheckingAttendance(true);

    try {
      const existing = await dbService.getTodayAttendance(staff.id);
      setTodayAttendance(existing);
    } catch (err: any) {
      console.warn('Error fetching attendance:', err);
    } finally {
      setCheckingAttendance(false);
    }

    if (enableGpsValidation && !currentCoords) {
      fetchCurrentGps();
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
    }
  };

  const handleClockIn = async () => {
    if (!selectedStaff) return;

    // Validate PIN
    if (selectedStaff.pin_code !== pin) {
      setError('Kode PIN salah. Silakan coba lagi.');
      setPin('');
      return;
    }

    // Validate GPS if enabled
    let isLocationValid = true;
    let computedDistance = distanceMeters || 0;

    if (enableGpsValidation) {
      if (gpsError || !currentCoords) {
        setError('Validasi lokasi gagal! GPS peranti belum aktif atau izin ditolak.');
        return;
      }

      if (outletLat && outletLng && currentCoords) {
        computedDistance = calculateDistanceMeters(
          currentCoords.lat,
          currentCoords.lng,
          outletLat,
          outletLng
        );
        setDistanceMeters(computedDistance);

        if (computedDistance > maxAttendanceRadius) {
          isLocationValid = false;
          setError(
            `Absensi ditolak! Anda berada di luar area outlet. Jarak Anda: ${computedDistance}m (Maksimal: ${maxAttendanceRadius}m).`
          );
          return;
        }
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      await dbService.clockInAttendance({
        profile_id: selectedStaff.id,
        employee_name: selectedStaff.full_name,
        clock_in_lat: currentCoords?.lat,
        clock_in_lng: currentCoords?.lng,
        distance_meters: computedDistance,
        is_valid_location: isLocationValid,
        notes: notes || undefined,
      });

      setSuccessMsg(`Berhasil Absen Masuk! Jam: ${new Date().toLocaleTimeString('id-ID')}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan absensi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedStaff || !todayAttendance) return;

    if (selectedStaff.pin_code !== pin) {
      setError('Kode PIN salah. Silakan coba lagi.');
      setPin('');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await dbService.clockOutAttendance(todayAttendance.id, {
        clock_out_lat: currentCoords?.lat,
        clock_out_lng: currentCoords?.lng,
        notes: notes || undefined,
      });

      setSuccessMsg(`Berhasil Absen Pulang! Jam: ${new Date().toLocaleTimeString('id-ID')}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui absensi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm font-sans p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="bg-coffee-500 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="w-6 h-6" />
            <div>
              <h2 className="font-extrabold text-base leading-tight">Absensi Karyawan</h2>
              <p className="text-[11px] text-coffee-200">Clock In & Clock Out dengan PIN & Validasi GPS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-coffee-200 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* Success Banner */}
          {successMsg ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="font-extrabold text-base text-emerald-800 dark:text-emerald-200">{successMsg}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Terima kasih atas kerja keras Anda hari ini!</p>
            </div>
          ) : !selectedStaff ? (
            /* Step 1: Select Employee */
            <div className="space-y-3">
              <label className="font-bold text-stone-700 dark:text-stone-300 block uppercase tracking-wider text-[11px]">
                Pilih Nama Karyawan
              </label>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {profiles.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleSelectStaff(staff)}
                    className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-coffee-500 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-coffee-50/50 transition flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-coffee-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100">{staff.full_name}</h4>
                        <p className="text-[10px] text-stone-400 font-medium">{staff.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-stone-200 dark:bg-stone-750 text-stone-700 dark:text-stone-300">
                      {staff.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Step 2: Attendance Action & PIN Entry */
            <div className="space-y-4">
              {/* Selected Staff Badge */}
              <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-750">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-coffee-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedStaff.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-800 dark:text-stone-100">{selectedStaff.full_name}</h4>
                    <p className="text-[10px] text-stone-400">{selectedStaff.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="text-xs text-coffee-600 dark:text-coffee-400 font-semibold hover:underline"
                >
                  Ganti
                </button>
              </div>

              {/* GPS Geofencing Info Banner */}
              {enableGpsValidation && (
                <div className={`p-3 rounded-2xl border text-[11px] flex items-center justify-between ${
                  gpsError
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                    : distanceMeters !== null && distanceMeters <= maxAttendanceRadius
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <div>
                      {gettingGps ? (
                        <span>Mendapatkan posisi GPS Anda...</span>
                      ) : gpsError ? (
                        <span>{gpsError}</span>
                      ) : distanceMeters !== null ? (
                        <span>
                          Jarak dari Outlet: <strong>{distanceMeters}m</strong> (Batas: {maxAttendanceRadius}m)
                          {distanceMeters <= maxAttendanceRadius ? ' — Lokasi Valid ✅' : ' — Di Luar Area ❌'}
                        </span>
                      ) : (
                        <span>Memeriksa posisi GPS outlet...</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCurrentGps}
                    className="text-[10px] font-bold underline hover:opacity-80 shrink-0 ml-2"
                  >
                    Refresh GPS
                  </button>
                </div>
              )}

              {/* Attendance Status & Action */}
              {checkingAttendance ? (
                <div className="p-4 text-center text-stone-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-coffee-500" />
                  <span>Memeriksa status absensi hari ini...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-stone-50 dark:bg-stone-850 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1.5">
                    <div className="flex justify-between text-stone-500">
                      <span>Tanggal Hari Ini:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-100">{new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Jam Masuk (Clock In):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {todayAttendance?.clock_in
                          ? new Date(todayAttendance.clock_in).toLocaleTimeString('id-ID')
                          : 'Belum Absen Masuk'}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Jam Pulang (Clock Out):</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {todayAttendance?.clock_out
                          ? new Date(todayAttendance.clock_out).toLocaleTimeString('id-ID')
                          : 'Belum Absen Pulang'}
                      </span>
                    </div>
                  </div>

                  {/* 6 Digit PIN Display */}
                  <div>
                    <label className="text-center block font-semibold text-stone-600 dark:text-stone-400 mb-2">
                      Masukkan 6-Digit PIN Anda
                    </label>
                    <div className="flex justify-center gap-2.5">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            pin.length > idx
                              ? 'bg-coffee-500 border-coffee-500 scale-110'
                              : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* PIN Numpad */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handlePinDigit(digit)}
                        className="h-11 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-coffee-50 dark:hover:bg-coffee-950/30 text-stone-800 dark:text-stone-100 font-bold text-base shadow-xs transition"
                      >
                        {digit}
                      </button>
                    ))}
                    <div className="h-11" />
                    <button
                      type="button"
                      onClick={() => handlePinDigit('0')}
                      className="h-11 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-coffee-50 dark:hover:bg-coffee-950/30 text-stone-800 dark:text-stone-100 font-bold text-base shadow-xs transition"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setPin(pin.slice(0, -1))}
                      className="h-11 rounded-xl bg-stone-200 dark:bg-stone-750 text-stone-600 dark:text-stone-300 font-bold text-xs shadow-xs transition flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="font-semibold text-stone-600 dark:text-stone-400 block mb-1">Catatan Absensi (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Datang lebih awal / Tukar shift..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Action Buttons */}
                  <div className="pt-2">
                    {!todayAttendance ? (
                      <button
                        type="button"
                        onClick={handleClockIn}
                        disabled={isLoading || pin.length !== 6}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        <span>ABSEN MASUK (CLOCK IN)</span>
                      </button>
                    ) : !todayAttendance.clock_out ? (
                      <button
                        type="button"
                        onClick={handleClockOut}
                        disabled={isLoading || pin.length !== 6}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        <span>ABSEN PULANG (CLOCK OUT)</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-center text-stone-500 font-bold">
                        Anda Sudah Menyelesaikan Absensi Hari Ini.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
