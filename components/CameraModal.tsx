
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCcw } from 'lucide-react';

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]); // Re-run if facing mode changes

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        // Flip horizontally if using front camera for mirror effect
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-auto">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white font-medium font-bogle tracking-wide">Take a Selfie</div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md text-white hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Feed */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {error ? (
             <div className="text-center px-6">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={onClose} className="px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">Close</button>
             </div>
        ) : (
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-around items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <button 
            onClick={toggleCamera} 
            className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all"
        >
            <RefreshCcw className="w-6 h-6" />
        </button>

        <button 
            onClick={handleCapture} 
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
            <div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform" />
        </button>
        
        <div className="w-14" /> {/* Spacer for balance */}
      </div>
    </div>
  );
};

export default CameraModal;
