
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { motion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { FeedPost, PostStatus } from '../types';
import { VeoLogo } from './icons';
import { AlertCircle, Download, Sparkles, Bolt } from 'lucide-react';

const VideoCard: React.FC<{ post: FeedPost }> = ({ post }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isHovered, setIsHovered] = useState(false);

  const status = post.status ?? PostStatus.SUCCESS; // Default to success for sample data

  // Determine aspect ratio class based on model tag or simple heuristics for demo
  // In a real app, you might store aspectRatio in the post object.
  // Veo = Tall (usually), Veo Fast = Square (for this demo's grid logic)
  const isTall = post.modelTag === 'Veo' || post.videoUrl?.includes('portrait');
  const aspectRatioClass = isTall ? 'aspect-[9/16] md:row-span-2' : 'aspect-square';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (status === PostStatus.SUCCESS && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {}); // Handle autoplay block
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (status === PostStatus.SUCCESS && videoRef.current) {
      videoRef.current.muted = true;
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click issues
    if (!post.videoUrl || status !== PostStatus.SUCCESS) return;

    try {
        if (post.videoUrl.startsWith('blob:')) {
            const a = document.createElement('a');
            a.href = post.videoUrl;
            a.download = `veo-video-${post.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            const response = await fetch(post.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `veo-video-${post.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Download failed:", error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case PostStatus.GENERATING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-deep-purple/90 p-6 text-center z-0">
             {/* Reference Image Background */}
            {post.referenceImageBase64 && (
              <div className="absolute inset-0 z-0 opacity-30 blur-md">
                <img src={`data:image/png;base64,${post.referenceImageBase64}`} alt="Reference" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin mb-2"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-white mb-1 animate-pulse">Generating...</p>
            </div>
             <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>
        );
      case PostStatus.ERROR:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-xs text-red-300">{post.errorMessage || "Error"}</p>
          </div>
        );
      case PostStatus.SUCCESS:
      default:
        return (
          <video
            ref={videoRef}
            src={post.videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            autoPlay
          />
        );
    }
  };

  return (
    <motion.article
      className={`group relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-transform hover:scale-[1.02] ${aspectRatioClass} bg-glass-white`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold border border-white/10 flex items-center gap-1 text-white shadow-lg">
              <Bolt className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {post.modelTag}
          </span>
      </div>

      {isTall && (
        <div className="absolute top-3 left-3 z-20">
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold tracking-wide border border-white/10 text-white">AI GEN</span>
        </div>
      )}

      {renderContent()}

      {/* Overlay */}
      <div className="absolute inset-0 glass-card-overlay flex flex-col justify-end p-4 opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-2">
            <img className="w-5 h-5 rounded-full object-cover border border-white/50" src={post.avatarUrl} alt={post.username} />
            <span className="text-xs font-bold text-gray-200">{post.username}</span>
        </div>
        
        <div className="flex justify-between items-end">
            <p className="text-xs text-gray-300 font-light leading-tight pr-4 line-clamp-2">{post.description}</p>
            {status === PostStatus.SUCCESS && (
                <button 
                    onClick={handleDownload}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors border border-white/10 shrink-0 text-white"
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>
    </motion.article>
  );
};

export default VideoCard;
