
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  // EXTEND_VIDEO = 'Extend Video',
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  prompt: string;
  originalPrompt?: string; // Display text for the UI
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  isLooping?: boolean;
}

export enum PostStatus {
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface FeedPost {
  id: string;
  videoUrl?: string;
  username: string;
  avatarUrl: string;
  description: string;
  modelTag: string;
  status?: PostStatus; // If undefined, implies legacy/sample success
  errorMessage?: string;
  referenceImageBase64?: string; // To show during loading
}

export interface CameoProfile {
  id: string;
  name: string;
  imageUrl: string; // In a real app, this would be a URL. For this demo, we'll use base64 placeholders.
}
