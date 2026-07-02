import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

export function getThumbnailUrl(videoId: string, quality: 'maxresdefault' | 'sddefault' | 'hqdefault' = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
