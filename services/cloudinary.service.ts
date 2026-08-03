/**
 * CloudinaryService Mobile - Upload direct vers Cloudinary (sans passer par le backend)
 * Miroir exact de frontend/src/services/cloudinary.service.ts
 * Le backend Cloudinary est réservé aux PDFs ; les photos s'uploadent côté client.
 */

import axios from 'axios';

// EXPO_PUBLIC_ requis par Expo pour exposer les variables au bundle JS
// Fallbacks identiques au pattern de API.ts (URL Railway hardcodée)
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

/**
 * Upload une image en base64 (ex: signature) directement vers Cloudinary via JSON body.
 * Retourne { url, filename } à utiliser dans les appels backend.
 */
export async function uploadBase64ToCloudinary(
  base64Data: string, // 'data:image/png;base64,...'
  filenamePrefix = 'signature'
): Promise<{ url: string; filename: string }> {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name non défini');
  }

  const filename = `${filenamePrefix}_${Date.now()}.png`;

  if (__DEV__) console.log(`✍️ [Cloudinary] Upload base64: cloud=${CLOUD_NAME} preset=${UPLOAD_PRESET}`);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { file: base64Data, upload_preset: UPLOAD_PRESET },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (__DEV__) console.log(`✅ [Cloudinary] Upload base64 réussi:`, response.data.secure_url);

    return {
      url: response.data.secure_url as string,
      filename: (response.data.public_id as string) || filename,
    };
  } catch (error: any) {
    const detail = error?.response?.data?.error?.message || error?.message || 'Erreur inconnue';
    console.error(`❌ [Cloudinary] Erreur upload base64:`, detail);
    throw new Error(`Cloudinary: ${detail}`);
  }
}

/**
 * Upload une photo (URI locale React Native) directement vers Cloudinary.
 * Retourne { url, filename } à utiliser dans les appels backend.
 */
export async function uploadPhotoToCloudinary(
  photoUri: string
): Promise<{ url: string; filename: string }> {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name non défini');
  }

  const filename = photoUri.split('/').pop() || `photo_${Date.now()}.jpg`;

  if (__DEV__) console.log(`📸 [Cloudinary] Upload: cloud=${CLOUD_NAME} preset=${UPLOAD_PRESET} file=${filename}`);

  // Identique au web : uniquement 'file' + 'upload_preset'
  const formData = new FormData();
  formData.append('file', { uri: photoUri, type: 'image/jpeg', name: filename } as any);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (__DEV__) console.log(`✅ [Cloudinary] Upload réussi:`, response.data.secure_url);

    return {
      url: response.data.secure_url as string,
      filename: (response.data.public_id as string) || filename,
    };
  } catch (error: any) {
    const detail = error?.response?.data?.error?.message || error?.message || 'Erreur inconnue';
    console.error(`❌ [Cloudinary] Erreur 400 détail:`, detail, error?.response?.data);
    throw new Error(`Cloudinary: ${detail}`);
  }
}
