export const uploadToCloudinary = async (file: File, uploadPresetOverride?: string): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = uploadPresetOverride || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || uploadPreset.trim() === '') {
    throw new Error('Cloudinary credentials are not configured in .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset.trim());

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    let errMsg = errorData.error?.message || 'Failed to upload image to Cloudinary';
    if (errMsg.toLowerCase().includes('unsigned upload')) {
      errMsg = 'The upload preset in .env must be set to "Unsigned" in Cloudinary settings.';
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.secure_url;
};
