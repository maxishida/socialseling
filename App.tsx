
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import BottomPromptBar from './components/BottomPromptBar';
import VideoCard from './components/VideoCard';
import { generateVideo } from './services/geminiService';
import { FeedPost, GenerateVideoParams, PostStatus } from './types';
import { Clapperboard } from 'lucide-react';

// Sample video URLs for the feed (public domain/creative commons)
const sampleVideos: FeedPost[] = [
  {
    id: 's1',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-alisa.mp4',
    username: 'alisa_fortin',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Maria',
    description: 'Sipping coffee at a parisian cafe',
    modelTag: 'Veo Flash',
    status: PostStatus.SUCCESS,
  },
  {
    id: 's2',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-omar.mp4',
    username: 'osanseviero',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Emery',
    description: 'At a llama petting zoo',
    modelTag: 'Veo Flash',
    status: PostStatus.SUCCESS,
  },
  {
    id: 's3',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-ammaar.mp4',
    username: 'ammaar',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Kimberly',
    description: 'At a red carpet ceremony',
    modelTag: 'Veo',
    status: PostStatus.SUCCESS,
  },
    {
    id: 's4',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-logan.mp4',
    username: 'OfficialLoganK',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jocelyn',
    description: 'Vibe coding on a mountain.',
    modelTag: 'Veo Flash',
    status: PostStatus.SUCCESS,
  },
    {
    id: 's5',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-kat.mp4',
    username: 'kat_kampf',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jameson',
    description: 'Exploring a majestic temple in a forest.',
    modelTag: 'Veo Flash',
    status: PostStatus.SUCCESS,
  },
    {
    id: 's6',
    videoUrl: 'https://storage.googleapis.com/sideprojects-asronline/veo-cameos/cameo-josh.mp4',
    username: 'joshwoodward',
    avatarUrl: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Jade',
    description: 'On the Google Keynote stage.',
    modelTag: 'Veo Flash',
    status: PostStatus.SUCCESS,
  },    
];

const App: React.FC = () => {
  const [feed, setFeed] = useState<FeedPost[]>(sampleVideos);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Auto-dismiss error toast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const updateFeedPost = (id: string, updates: Partial<FeedPost>) => {
    setFeed(prevFeed => 
      prevFeed.map(post => 
        post.id === id ? { ...post, ...updates } : post
      )
    );
  };

  const processGeneration = async (postId: string, params: GenerateVideoParams) => {
    try {
      const { url } = await generateVideo(params);
      updateFeedPost(postId, { videoUrl: url, status: PostStatus.SUCCESS });
    } catch (error) {
      console.error('Video generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
      updateFeedPost(postId, { status: PostStatus.ERROR, errorMessage: errorMessage });
      
      // Global error toast for specific API key issues
      if (typeof errorMessage === 'string' && (
          errorMessage.includes('API_KEY_INVALID') || 
          errorMessage.includes('permission denied') ||
          errorMessage.includes('Requested entity was not found')
      )) {
        setErrorToast('Invalid API key or permissions. Please check billing.');
      }
    }
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    // API Key Check - deferred until generation attempt
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        setShowApiKeyDialog(true);
        return;
      }
    }

    const newPostId = Date.now().toString();
    const refImage = params.referenceImages?.[0]?.base64;

    // Create new post object with GENERATING status
    const newPost: FeedPost = {
      id: newPostId,
      username: 'you',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
      description: params.originalPrompt || params.prompt, // Use original prompt for display if available
      modelTag: params.model === 'veo-3.1-fast-generate-preview' ? 'Veo Flash' : 'Veo',
      status: PostStatus.GENERATING,
      referenceImageBase64: refImage,
    };

    // Prepend to feed immediately
    setFeed(prev => [newPost, ...prev]);

    // Start generation in background
    processGeneration(newPostId, params);

  }, []);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="h-screen w-screen text-white flex flex-col overflow-hidden font-sans selection:bg-white/20 selection:text-white relative bg-main-gradient">
      {/* Ambient Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      
      {/* Error Toast */}
      <AnimatePresence>
        {errorToast && (
            <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 24, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-neutral-900/80 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-md text-center text-sm font-medium flex items-center gap-3"
            >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></div>
                {errorToast}
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 flex justify-between items-center">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
                <div className="text-white text-xl font-bold tracking-widest flex items-center gap-2">
                    <Clapperboard className="text-pink-400 w-6 h-6" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase font-sans">AI DIGITAL BUSINESS</span>
                </div>
            </div>
            {/* Profile Section */}
            <div className="flex items-center gap-3">
                <img alt="Profile" className="w-8 h-8 rounded-full border border-white/30 object-cover" src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <div className="text-sm text-gray-300 hidden sm:block">
                    Created by <span className="text-white font-medium hover:text-pink-300 cursor-pointer transition-colors">@owner</span>
                </div>
            </div>
        </div>
      </header>

      <main className="relative z-10 pt-28 pb-40 px-4 md:px-8 max-w-7xl mx-auto w-full h-full overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            <AnimatePresence initial={false}>
              {feed.map((post) => (
                <VideoCard key={post.id} post={post} />
              ))}
            </AnimatePresence>
        </div>
      </main>

      <BottomPromptBar onGenerate={handleGenerate} />
    </div>
  );
};

export default App;
