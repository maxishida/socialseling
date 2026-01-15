
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState, useEffect } from 'react';
import { AspectRatio, CameoProfile, GenerateVideoParams, GenerationMode, ImageFile, Resolution, VeoModel } from '../types';
import { ArrowRight, Plus, Camera, TextCursorInput } from 'lucide-react';
import CameraModal from './CameraModal';

// Use PNG for cameos to ensure compatibility
const defaultCameoProfiles: CameoProfile[] = [
  { id: '1', name: 'asr', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=asr&backgroundColor=transparent' },
  { id: '2', name: 'skirano', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=skirano&backgroundColor=transparent' },
  { id: '3', name: 'lc-99', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=lc99&backgroundColor=transparent' },
  { id: '4', name: 'sama', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=sama&backgroundColor=transparent' },
  { id: '5', name: 'justinem', imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=justinem&backgroundColor=transparent' },
];

const examplePrompts = [
  "Vibecoding on a snowy mountain top...",
  "Skydiving over the crystal blue Bahamas...",
  "Walking the red carpet at a movie premiere...",
  "Piloting a spaceship through a colorful nebula...",
  "Dj-ing at a massive neon music festival...",
  "Discovering an ancient temple in the jungle...",
];

// Helper to fetch image from URL and convert to base64 for API
const urlToImageFile = async (url: string): Promise<ImageFile> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        const file = new File([blob], 'cameo.png', { type: blob.type });
        resolve({ file, base64 });
      } else {
        reject(new Error("Failed to read image data as string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const fileToImageFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            if (base64) {
              resolve({file, base64});
            } else {
              reject(new Error('Failed to extract base64 data.'));
            }
        } else {
            reject(new Error('FileReader result is not a string.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
};

interface BottomPromptBarProps {
  onGenerate: (params: GenerateVideoParams) => void;
}

const BottomPromptBar: React.FC<BottomPromptBarProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedCameoId, setSelectedCameoId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const [profiles, setProfiles] = useState<CameoProfile[]>(defaultCameoProfiles);
  const [profileImages, setProfileImages] = useState<Record<string, ImageFile>>({});
  const uploadedImageUrlsRef = useRef<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
        uploadedImageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleCameoSelect = (id: string) => {
    setSelectedCameoId(prev => prev === id ? null : id);
  };

  const handleCameraCapture = async (file: File) => {
    try {
        const imgFile = await fileToImageFile(file);
        const newId = `user-cam-${Date.now()}`;
        const objectUrl = URL.createObjectURL(file);
        uploadedImageUrlsRef.current.push(objectUrl);

        const newProfile: CameoProfile = {
            id: newId,
            name: 'Selfie',
            imageUrl: objectUrl,
        };

        setProfiles(prev => [newProfile, ...prev]);
        setProfileImages(prev => ({ ...prev, [newId]: imgFile }));
        setSelectedCameoId(newId);
    } catch (e) {
        console.error("Error processing camera capture", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (!file.type.startsWith('image/')) return;
        
        const imgFile = await fileToImageFile(file);
        const newId = `user-${Date.now()}`;
        const objectUrl = URL.createObjectURL(file);
        uploadedImageUrlsRef.current.push(objectUrl);

        const newProfile: CameoProfile = {
            id: newId,
            name: 'You',
            imageUrl: objectUrl,
        };

        setProfiles(prev => [newProfile, ...prev]);
        setProfileImages(prev => ({ ...prev, [newId]: imgFile }));
        setSelectedCameoId(newId);
      } catch (error) {
        console.error("Error uploading file", error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getProfileImage = async (profile: CameoProfile): Promise<ImageFile> => {
    if (profileImages[profile.id]) return profileImages[profile.id];
    if (profile.id.startsWith('user-')) throw new Error('Image data not found for user profile.');

    const imgFile = await urlToImageFile(profile.imageUrl);
    setProfileImages(prev => ({ ...prev, [profile.id]: imgFile }));
    return imgFile;
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    let mode = GenerationMode.TEXT_TO_VIDEO;
    let referenceImages: ImageFile[] | undefined = undefined;
    let selectedModel = VeoModel.VEO_FAST;
    let currentAspectRatio = AspectRatio.PORTRAIT;

    if (selectedCameoId) {
      mode = GenerationMode.REFERENCES_TO_VIDEO;
      selectedModel = VeoModel.VEO; 
      currentAspectRatio = AspectRatio.LANDSCAPE;

      const cameo = profiles.find(c => c.id === selectedCameoId);
      if (cameo) {
        try {
            const imgFile = await getProfileImage(cameo);
            referenceImages = [imgFile];
        } catch (e) {
            console.error("Failed to load cameo image", e);
            return;
        }
      }
    }

    const params: GenerateVideoParams = {
      prompt: prompt,
      originalPrompt: prompt,
      model: selectedModel,
      aspectRatio: currentAspectRatio,
      resolution: Resolution.P720,
      mode: mode,
      referenceImages: referenceImages,
    };

    onGenerate(params);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
    {showCamera && (
        <CameraModal 
            onCapture={handleCameraCapture} 
            onClose={() => setShowCamera(false)} 
        />
    )}
    
    <footer className="fixed bottom-8 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="glass-panel w-full max-w-[700px] rounded-3xl p-2 pointer-events-auto border border-white/20 bg-glass-white backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-3 p-2">
                
                {/* Select Face Row */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider ml-1">Select Face</span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {/* Camera Button */}
                        <button 
                            onClick={() => setShowCamera(true)}
                            className="w-8 h-8 rounded-lg border border-dashed border-white/50 text-white/50 hover:border-white hover:text-white flex items-center justify-center transition-all shrink-0"
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Upload Button */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-8 h-8 rounded-lg border border-dashed border-white/50 text-white/50 hover:border-white hover:text-white flex items-center justify-center transition-all shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        </button>

                        {/* Avatars */}
                        {profiles.map((profile) => (
                            <button 
                                key={profile.id}
                                onClick={() => handleCameoSelect(profile.id)}
                                className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 transition-all border ${
                                    selectedCameoId === profile.id 
                                    ? 'border-white opacity-100 ring-2 ring-white/20' 
                                    : 'border-transparent grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:border-white'
                                }`}
                            >
                                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input Row */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-gray-400 shrink-0">
                        <TextCursorInput className="w-4 h-4" />
                    </div>
                    <input 
                        className="bg-transparent border-none text-sm text-white placeholder-gray-500 w-full focus:outline-none focus:ring-0 p-0 font-light tracking-wide" 
                        placeholder="Discovering an ancient temple in the jungle..." 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={!prompt.trim()}
                        className={`bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-colors shrink-0 ${!prompt.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Generate
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    </footer>
    </>
  );
};

export default BottomPromptBar;
