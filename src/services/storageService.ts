import { supabase } from '../lib/supabase';

export const storageService = {
  // Compress image client-side via HTML5 Canvas
  async compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal mendapatkan konteks Canvas 2D'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Kompresi gambar gagal'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    });
  },

  // Upload image to Supabase Storage Bucket ('product-images')
  async uploadProductImage(file: File): Promise<string> {
    try {
      // 1. Compress Image on the fly (max 800px width, 80% JPEG quality)
      const compressedBlob = await this.compressImage(file, 800, 0.8);
      const fileExt = 'jpg';
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // 2. Upload Compressed Blob to Supabase Bucket
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error (will fallback to object URL):', error.message);
        return URL.createObjectURL(compressedBlob);
      }

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.warn('Fallback local compressed preview URL:', err?.message);
      const fallbackBlob = await this.compressImage(file);
      return URL.createObjectURL(fallbackBlob);
    }
  },
};
