/**
 * CloudinaryService Mobile - Upload direct vers Cloudinary (sans passer par le backend)
 * Miroir exact de frontend/src/services/cloudinary.service.ts
 * Le backend Cloudinary est réservé aux PDFs ; les photos s'uploadent côté client.
 */

import axios from 'axios';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload une photo (URI locale React Native) directement vers Cloudinary.
 * Retourne { url, filename } à utiliser dans les appels backend.
 */
export async function uploadPhotoToCloudinary(
  photoUri: string,
  folder: string = 'mytruck-photos'
): Promise<{ url: string; filename: string }> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME et EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET doivent être définis dans .env'
    );
  }

  const filename = photoUri.split('/').pop() || `photo_${Date.now()}.jpg`;

  // React Native FormData : le champ 'file' accepte { uri, type, name }
  const formData = new FormData();
  formData.append('file', { uri: photoUri, type: 'image/jpeg', name: filename } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return {
    url: response.data.secure_url as string,
    filename: (response.data.public_id as string) || filename,
  };
}
