export const uploadToCloudinary = async (file: File, uploadPresetOverride?: string): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = uploadPresetOverride || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || uploadPreset.trim() === '' || uploadPreset.includes('your_unsigned_upload_preset_here')) {
    throw new Error('Please configure a valid Unsigned Upload Preset in .env (VITE_CLOUDINARY_UPLOAD_PRESET)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset.trim());

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errMsg = errorData.error?.message || 'Failed to upload image to Cloudinary';
    const lower = errMsg.toLowerCase();
    if (lower.includes('unsigned') || lower.includes('unknown api key') || lower.includes('must supply api_key') || lower.includes('preset')) {
      errMsg = 'Cloudinary error: Ensure "' + uploadPreset.trim() + '" exists as an "Unsigned" upload preset in your Cloudinary console for cloud "' + cloudName.trim() + '".';
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.secure_url;
};
