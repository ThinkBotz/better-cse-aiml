import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '../cloudinary';

interface ImageUploaderProps {
  onUploadSuccess: (urls: string[]) => void;
  maxFiles?: number;
  buttonLabel?: string;
  uploadPreset?: string;
  initialImages?: string[];
}

export default function ImageUploader({ 
  onUploadSuccess, 
  maxFiles = 5, 
  buttonLabel = "Upload Images", 
  uploadPreset,
  initialImages
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialImages || []);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setUploadedUrls(initialImages);
    }
  }, [initialImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    
    if (uploadedUrls.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file, uploadPreset));
      const urls = await Promise.all(uploadPromises);
      
      const newUrls = [...uploadedUrls, ...urls];
      setUploadedUrls(newUrls);
      onUploadSuccess(newUrls);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload images. Check credentials.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newUrls = uploadedUrls.filter((_, idx) => idx !== indexToRemove);
    setUploadedUrls(newUrls);
    onUploadSuccess(newUrls);
  };

  return (
    <div className="space-y-3">
      {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</div>}
      
      {uploadedUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedUrls.map((url, idx) => (
            <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-divider">
              <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/75 hover:bg-rose-600 p-1 rounded-md text-white transition-colors cursor-pointer shadow-sm"
                title="Remove photo"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedUrls.length < maxFiles && (
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
            multiple
          />
          <button 
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="bg-surface-accent hover:bg-divider text-secondary border border-divider text-xs font-bold uppercase py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 w-full"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            {isUploading ? 'Uploading...' : buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
