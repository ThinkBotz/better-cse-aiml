import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { Camera, Image, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
}

export default function QRCameraScanner({ onScan, onError }: QRCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan cooldown tracker to prevent multiple rapid triggers for the same code
  const lastScanTimeRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  // Discover cameras on mount
  useEffect(() => {
    let isMounted = true;

    async function initCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/rear camera on mobile devices
          const backCam = devices.find(d => /back|rear|environment|primary/i.test(d.label));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          // No enumerated cameras, but start() with facingMode might still work
          setSelectedCameraId('default');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn("Could not enumerate cameras, falling back to facingMode constraints:", err);
        setSelectedCameraId('default');
      }
    }

    initCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  // Start or restart scanner when selected camera changes
  useEffect(() => {
    if (!selectedCameraId) return;

    let isMounted = true;
    const elementId = "qr-reader-viewport";

    const startScanner = async () => {
      setCameraError(null);

      // Stop previous instance if running
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Error cleaning up previous scanner", e);
        }
      }

      if (!isMounted) return;

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: Math.max(180, edge), height: Math.max(180, edge) };
        },
        aspectRatio: 1.0,
      };

      const handleSuccess = (decodedText: string) => {
        const now = Date.now();
        // Ignore identical scan within 2.5 seconds
        if (
          lastScanTimeRef.current.text === decodedText &&
          now - lastScanTimeRef.current.time < 2500
        ) {
          return;
        }

        lastScanTimeRef.current = { text: decodedText, time: now };
        setLastScanned(decodedText);
        if (onScanRef.current) {
          onScanRef.current(decodedText);
        }
      };

      // Frame parse miss callback - purposely empty to avoid spamming errors on non-QR frames
      const handleFrameMiss = () => {};

      try {
        if (selectedCameraId !== 'default') {
          await scanner.start(selectedCameraId, qrConfig, handleSuccess, handleFrameMiss);
        } else {
          // Try environment first, fallback to user
          try {
            await scanner.start({ facingMode: "environment" }, qrConfig, handleSuccess, handleFrameMiss);
          } catch (envErr) {
            console.warn("FacingMode environment failed, trying user camera...", envErr);
            await scanner.start({ facingMode: "user" }, qrConfig, handleSuccess, handleFrameMiss);
          }
        }
        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Camera start error:", err);
        setIsScanning(false);
        let errorMsg = "Unable to start camera.";
        if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
          errorMsg = "Camera permission denied. Please allow camera access in browser settings.";
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          errorMsg = "No video camera detected on this device.";
        } else if (err?.name === 'NotReadableError') {
          errorMsg = "Camera is currently used by another application.";
        }
        setCameraError(errorMsg);
        if (onErrorRef.current) {
          onErrorRef.current(new Error(errorMsg));
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Unmount cleanup error:", e);
        }
      }
    };
  }, [selectedCameraId]);

  // Handle manual image upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      // Use existing scanner or create a transient one for file scanning
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("qr-reader-viewport");
      }
      const decodedResult = await scanner.scanFile(file, true);
      setLastScanned(decodedResult);
      if (onScanRef.current) {
        onScanRef.current(decodedResult);
      }
    } catch (err: any) {
      console.warn("File scan error:", err);
      const msg = "No valid QR code found in this image. Please upload a clear photo of the QR code.";
      setCameraError(msg);
      if (onErrorRef.current) {
        onErrorRef.current(new Error(msg));
      }
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* Scanner Viewport */}
      <div className="relative w-full aspect-square bg-neutral-950 rounded-2xl overflow-hidden border border-divider shadow-inner flex items-center justify-center">
        <div id="qr-reader-viewport" className="w-full h-full object-cover"></div>

        {/* Viewfinder Target Graphic (Overlaid when scanning) */}
        {isScanning && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-indigo-400/80 rounded-2xl relative">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl"></div>
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr"></div>
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl"></div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br"></div>
              
              {/* Animated Scan Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
            </div>
            <span className="absolute bottom-4 text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-medium">
              Align QR code inside box
            </span>
          </div>
        )}

        {/* Camera Permission / Hardware Error state */}
        {cameraError && (
          <div className="absolute inset-0 bg-neutral-900/95 p-4 flex flex-col items-center justify-center text-center space-y-2.5 z-10">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs text-rose-300 font-semibold px-2">{cameraError}</p>
            <p className="text-[10px] text-secondary">
              You can also upload a photo/screenshot of the QR code below.
            </p>
            <button
              onClick={() => setSelectedCameraId(prev => prev === 'default' ? '' : 'default')}
              className="mt-2 text-[10px] font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Camera
            </button>
          </div>
        )}

        {/* Loading / Initializing state */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-[11px] font-medium">Initializing camera...</span>
          </div>
        )}
      </div>

      {/* Camera Controls & File Upload Bar */}
      <div className="flex items-center gap-2">
        {/* Camera Switcher (if multiple cameras available) */}
        {cameras.length > 1 && (
          <div className="flex-1 relative">
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-surface border border-divider text-[11px] text-content rounded-xl py-2 px-3 outline-none cursor-pointer truncate"
            >
              {cameras.map((c, idx) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload QR image option */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingFile}
          className="flex-1 flex items-center justify-center gap-1.5 bg-surface-accent hover:bg-divider border border-divider text-content text-[11px] font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer"
        >
          {isProcessingFile ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Image className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{isProcessingFile ? "Reading QR..." : "Scan from Image"}</span>
        </button>
      </div>

      {/* Last Detected Code Indicator */}
      {lastScanned && (
        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px]">
          <span className="text-secondary flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Last detected:
          </span>
          <span className="font-mono font-bold text-indigo-300 truncate max-w-[180px]">
            {lastScanned}
          </span>
        </div>
      )}
    </div>
  );
}
