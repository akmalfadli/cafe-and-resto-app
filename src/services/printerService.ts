import type { Sale } from '../types';
import { useAppStore } from '../store/useAppStore';

let cachedDevice: any = null;

export const printerService = {
  // Helper to chunk large byte streams into 128-byte BLE packets for thermal printers
  async sendInChunks(characteristic: any, data: Uint8Array, chunkSize = 128) {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.subarray(i, i + chunkSize);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      // Small 10ms delay between packets to prevent BLE buffer overflow
      await new Promise((r) => setTimeout(r, 10));
    }
  },

  // Convert image URL / Base64 to ESC/POS Monochrome Raster Bitmap (GS v 0)
  async imageToEscPosRaster(imageUrl: string, maxWidth = 384): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      const loadCanvas = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width <= 0 || height <= 0) return resolve(null);

          // Scale width to fit 58mm printer (384 dots max width, byte-aligned to multiple of 8)
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          width = Math.floor(width / 8) * 8;
          if (width <= 0 || height <= 0) return resolve(null);

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = ctx.getImageData(0, 0, width, height);
          const pixels = imgData.data;

          const widthBytes = width / 8;
          // ESC/POS Command: GS v 0 m xL xH yL yH
          const commandHeader = new Uint8Array([
            0x1d, 0x76, 0x30, 0x00,
            widthBytes & 0xff, (widthBytes >> 8) & 0xff,
            height & 0xff, (height >> 8) & 0xff,
          ]);

          const rasterData = new Uint8Array(widthBytes * height);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = pixels[idx];
              const g = pixels[idx + 1];
              const b = pixels[idx + 2];
              const a = pixels[idx + 3];

              // Treat transparent/light pixels as white, dark pixels as black
              const isDark = a > 50 && (0.299 * r + 0.587 * g + 0.114 * b) < 160;
              if (isDark) {
                const byteIdx = y * widthBytes + Math.floor(x / 8);
                const bitIdx = 7 - (x % 8);
                rasterData[byteIdx] |= 1 << bitIdx;
              }
            }
          }

          const fullCommand = new Uint8Array(commandHeader.length + rasterData.length);
          fullCommand.set(commandHeader, 0);
          fullCommand.set(rasterData, commandHeader.length);

          resolve(fullCommand);
        } catch (e) {
          console.warn('Gagal memproses bitmap logo untuk printer:', e);
          resolve(null);
        }
      };

      img.onload = loadCanvas;
      img.onerror = async () => {
        // Fallback: Fetch image via Blob to bypass cross-origin restrictions
        try {
          const resp = await fetch(imageUrl);
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            img.width = fallbackImg.width;
            img.height = fallbackImg.height;
            loadCanvas();
          };
          fallbackImg.onerror = () => resolve(null);
          fallbackImg.src = objectUrl;
        } catch (fetchErr) {
          console.warn('Fallback fetch logo image failed:', fetchErr);
          resolve(null);
        }
      };

      img.src = imageUrl;
    });
  },

  // Web Bluetooth ESC/POS Print Handler
  async printViaBluetooth(
    sale: Sale,
    customHeader?: string,
    customFooter?: string,
    enableTableNumber: boolean = true,
    logoUrl?: string
  ): Promise<boolean> {
    try {
      if (!('bluetooth' in navigator)) {
        alert('Web Bluetooth API tidak didukung di browser ini. Gunakan Google Chrome atau Microsoft Edge.');
        window.print();
        return false;
      }

      let device = cachedDevice;

      // Connect or Prompt Web Bluetooth Picker
      if (!device || !device.gatt?.connected) {
        try {
          device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455'],
          });
          if (device) {
            cachedDevice = device;
          }
        } catch (pickerErr: any) {
          console.log('Bluetooth picker canceled by user:', pickerErr?.message);
          return false;
        }
      }

      if (!device || !device.gatt) {
        alert('Printer Bluetooth tidak dipilih.');
        return false;
      }

      // Connect GATT Server
      const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
      const services = await server.getPrimaryServices();

      if (services.length === 0) {
        throw new Error('Layanan printer bluetooth tidak ditemukan pada perangkat ini.');
      }

      const characteristics = await services[0].getCharacteristics();
      const writeCharacteristic = characteristics.find(
        (c: any) => c.properties.write || c.properties.writeWithoutResponse
      );

      if (!writeCharacteristic) {
        throw new Error('Karakteristik penulisan data printer tidak ditemukan.');
      }

      // Generate ESC/POS Stream
      const encoder = new TextEncoder();
      const INIT = new Uint8Array([0x1b, 0x40]);
      const ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
      const ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]);
      const PAPER_CUT = new Uint8Array([0x1d, 0x56, 0x41, 0x00]);

      const headerText = customHeader || ``;
      const footerText = customFooter || `Terima Kasih Atas Kunjungan Anda!`;

      // Initialize Printer
      await writeCharacteristic.writeValue(INIT);
      await writeCharacteristic.writeValue(ALIGN_CENTER);

      // Print Logo if available (catch logo conversion errors without breaking text print)
      if (logoUrl) {
        try {
          const logoRaster = await this.imageToEscPosRaster(logoUrl, 192);
          if (logoRaster) {
            await this.sendInChunks(writeCharacteristic, logoRaster, 128);
            await writeCharacteristic.writeValue(encoder.encode(`\n`));
          }
        } catch (e) {
          console.warn('Gagal mencetak logo bitmap:', e);
        }
      }

      // Header Section (Centered)
      if (headerText) {
        await writeCharacteristic.writeValue(encoder.encode(`${headerText}\n`));
      }
      await writeCharacteristic.writeValue(encoder.encode(`==============================\n`));

      // Helper to format a 32-column line with aligned colon and right-aligned value
      const formatRow = (label: string, value: string, colonPos = 14, totalWidth = 32): string => {
        const paddedLabel = label.padEnd(colonPos - 1, ' ');
        const leftPart = `${paddedLabel}: `;
        const spaceForValue = totalWidth - leftPart.length;
        const rightPart = value.padStart(spaceForValue, ' ');
        return `${leftPart}${rightPart}\n`;
      };

      // Transaction Meta (Aligned Colons)
      await writeCharacteristic.writeValue(ALIGN_LEFT);
      let metaText = formatRow('No. Struk', sale.receipt_number);
      metaText += formatRow('Tanggal', new Date(sale.created_at).toLocaleDateString('id-ID'));
      metaText += formatRow('Kasir', sale.cashier_name);
      if (sale.customer_name) {
        metaText += formatRow('Pelanggan', sale.customer_name);
      }
      metaText += formatRow('Tipe', sale.order_type.toUpperCase());
      if (enableTableNumber && sale.table_number) {
        metaText += formatRow('Meja', sale.table_number);
      }
      metaText += `------------------------------\n`;
      await writeCharacteristic.writeValue(encoder.encode(metaText));

      // Items List (Sorted by Category Order, Right Aligned Prices)
      let itemsText = '';
      const { products, categories } = useAppStore.getState();

      const sortedSaleItems = [...sale.items].sort((a, b) => {
        const prodA = products.find((p) => p.id === a.product_id);
        const prodB = products.find((p) => p.id === b.product_id);
        const catA = categories.find((c) => c.id === prodA?.category_id);
        const catB = categories.find((c) => c.id === prodB?.category_id);
        const orderA = catA?.sort_order ?? 999;
        const orderB = catB?.sort_order ?? 999;
        return orderA - orderB;
      });

      sortedSaleItems.forEach((item) => {
        const itemHeader = `${item.quantity}x ${item.product_name}\n`;
        const itemPrice = `@Rp ${item.unit_price.toLocaleString('id-ID')}`;
        const itemTotal = `Rp ${item.total_price.toLocaleString('id-ID')}`;
        const rightAlignedTotal = itemTotal.padStart(30 - itemPrice.length, ' ');
        itemsText += itemHeader;
        itemsText += `  ${itemPrice}${rightAlignedTotal}\n`;
      });
      itemsText += `------------------------------\n`;
      await writeCharacteristic.writeValue(encoder.encode(itemsText));

      // Financial Summary (Aligned Colons & Right-Aligned Amounts)
      const { taxRate, serviceRate } = useAppStore.getState();
      let summaryText = formatRow('Subtotal', `Rp ${sale.subtotal.toLocaleString('id-ID')}`);
      if (sale.discount_amount > 0) {
        summaryText += formatRow('Diskon', `-Rp ${sale.discount_amount.toLocaleString('id-ID')}`);
      }
      if (sale.tax_amount > 0) {
        summaryText += formatRow(`Pajak (${taxRate}%)`, `Rp ${sale.tax_amount.toLocaleString('id-ID')}`);
      }
      if (sale.service_charge > 0) {
        summaryText += formatRow(`Layanan (${serviceRate}%)`, `Rp ${sale.service_charge.toLocaleString('id-ID')}`);
      }
      summaryText += `------------------------------\n`;
      summaryText += formatRow('TAGIHAN', `Rp ${sale.grand_total.toLocaleString('id-ID')}`);
      if (sale.payments && sale.payments.length > 0) {
        const p = sale.payments[0];
        summaryText += formatRow(`BAYAR (${p.method.toUpperCase()})`, `Rp ${p.amount.toLocaleString('id-ID')}`);
        summaryText += formatRow('KEMBALIAN', `Rp ${(p.change_amount || 0).toLocaleString('id-ID')}`);
      }
      summaryText += `==============================\n`;
      await writeCharacteristic.writeValue(encoder.encode(summaryText));

      // Footer Section (Centered)
      await writeCharacteristic.writeValue(ALIGN_CENTER);
      await writeCharacteristic.writeValue(encoder.encode(`${footerText}\n\n\n`));
      await writeCharacteristic.writeValue(PAPER_CUT);

      return true;
    } catch (err: any) {
      console.warn('Bluetooth Print Exception:', err?.message);
      cachedDevice = null;
      alert(`Gagal mencetak ke Bluetooth Printer: ${err?.message || 'Koneksi terputus'}`);
      return false;
    }
  },

  // Reset Saved Bluetooth Printer
  forgetSavedPrinter() {
    cachedDevice = null;
    localStorage.removeItem('saved_printer_device_id');
  },
};
